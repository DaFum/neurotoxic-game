// Constants for the Economic System
export const INCOME_CONSTANTS = {
    MERCH: {
        SHIRT: { price: 20, cost: 8, profit: 12 },
        HOODIE: { price: 40, cost: 18, profit: 22 },
        PATCH: { price: 3, cost: 0.5, profit: 2.5 },
        CD: { price: 10, cost: 2, profit: 8 },
        VINYL: { price: 25, cost: 12, profit: 13 }
    },
    STREAMING_PER_VIEW: 0.002, // Euro per view
};

export const EXPENSE_CONSTANTS = {
    TRANSPORT: {
        FUEL_PER_100KM: 12, // Liters
        FUEL_PRICE: 1.75, // Euro per Liter
        INSURANCE_MONTHLY: 80,
        MAINTENANCE_30DAYS: 200,
    },
    FOOD: {
        FAST_FOOD: 8, // Per person per day
        RESTAURANT: 15, // Per person per day
        ENERGY_DRINK: 3,
        ALCOHOL: 15
    },
    ACCOMMODATION: {
        HOSTEL: 25, // Per person
        HOTEL: 60, // Per person
    },
    EQUIPMENT: {
        STRINGS: 15,
        STICKS: 12,
        CABLE: 25,
        TUBES: 80
    },
    ADMIN: {
        PROBERAUM: 180, // Monthly
        INSURANCE_EQUIP: 150, // Monthly
    }
};

/**
 * Calculates the full financial breakdown of a gig with Fame Scaling and Hype bonuses.
 * @param {object} gigData - { capacity, price, pay (guarantee), dist, diff }
 * @param {number} performanceScore - 0 to 100
 * @param {object} crowdStats - { hype (0-100) }
 * @param {object} modifiers - { merchTable: bool, promo: bool, catering: bool }
 * @param {object} bandInventory - { shirts, hoodies, etc }
 * @param {number} playerFame - Total player fame
 * @param {object} gigStats - Detailed gig stats (misses, peakHype, etc)
 */
export const calculateGigFinancials = (gigData, performanceScore, crowdStats, modifiers, bandInventory, playerFame, gigStats) => {
    const report = {
        income: { total: 0, breakdown: [] },
        expenses: { total: 0, breakdown: [] },
        net: 0
    };

    // 1. TICKET SALES LOGIC (FAME SCALING)
    // Base draw is percentage of capacity based on difficulty (harder = more niche initially?)
    // Actually simpler: Base draw is ~30%. Fame fills the rest.
    const baseDrawRatio = 0.3;
    const fameRatio = Math.min(1.0, playerFame / (gigData.capacity * 10)); // Fame needs to be ~10x capacity to fill it easily
    let fillRate = baseDrawRatio + (fameRatio * 0.7); 
    
    // Promo Boost
    if (modifiers.promo) fillRate += 0.15;

    // Price Sensitivity: Higher price reduces attendance slightly unless Fame is very high
    if (gigData.price > 15) {
        const pricePenalty = (gigData.price - 15) * 0.02; // -2% per Euro over 15
        // High fame mitigates penalty
        const mitigation = fameRatio * 0.5;
        fillRate -= Math.max(0, pricePenalty - mitigation);
    }

    fillRate = Math.min(1.0, Math.max(0.1, fillRate)); // Clamp 10% - 100%

    const ticketsSold = Math.floor(gigData.capacity * fillRate);
    const ticketRevenue = ticketsSold * gigData.price;
    report.income.breakdown.push({ label: 'Ticket Sales', value: ticketRevenue, detail: `${ticketsSold} / ${gigData.capacity} sold` });
    report.income.total += ticketRevenue;

    // 2. GUARANTEE (If any)
    if (gigData.pay > 0) {
        report.income.breakdown.push({ label: 'Guarantee', value: gigData.pay, detail: 'Fixed fee' });
        report.income.total += gigData.pay;
    }

    // 3. MERCH SALES (HYPE SCALING & PENALTIES)
    // Base buy rate scales with crowd hype (score)
    let buyRate = 0.10 + (performanceScore / 100) * 0.20; // 10% - 30%
    if (performanceScore >= 95) {
        buyRate *= 2.0; // S-Rank Bonus
        report.income.breakdown.push({ label: 'HYPE BONUS', value: 0, detail: 'Merch frenzy (S-Rank)!' });
    }
    if (modifiers.merchTable) buyRate += 0.10; // Boost from table
    
    // Penalty: Misses drive people away (1% per miss)
    if (gigStats && gigStats.misses > 0) {
        const missPenalty = Math.min(buyRate, gigStats.misses * 0.01);
        buyRate -= missPenalty;
        // report.income.breakdown.push({ label: 'Sloppy Play', value: 0, detail: `-${(missPenalty*100).toFixed(1)}% Merch Interest` });
    }

    // Check Inventory Availability
    // Calculate max potential buyers based on inventory (simplified: 1 item per buyer)
    // Assume shirt is the main limiter for now or total inventory count
    const totalInventory = (bandInventory?.shirts || 0) + (bandInventory?.hoodies || 0) + (bandInventory?.cds || 0);
    const potentialBuyers = Math.floor(ticketsSold * Math.max(0, buyRate));
    const buyers = Math.min(potentialBuyers, totalInventory);
    
    // Average Spend per buyer (simplified mix)
    const merchAvgRevenue = 25; // Shirt + Sticker
    const merchAvgCost = 10;
    const merchRevenue = buyers * merchAvgRevenue;
    const merchCost = buyers * merchAvgCost;

    report.income.breakdown.push({ label: 'Merch Sales', value: merchRevenue, detail: `${buyers} buyers` });
    report.income.total += merchRevenue;
    
    report.expenses.breakdown.push({ label: 'Merch Restock', value: merchCost, detail: 'COGS' });
    report.expenses.total += merchCost;

    // 4. BAR CUT (15% of tickets sold * 5€ avg spend * 15% cut)
    const barRevenue = Math.floor(ticketsSold * 5 * 0.15);
    report.income.breakdown.push({ label: 'Bar Cut', value: barRevenue, detail: '15% of Bar' });
    report.income.total += barRevenue;

    // 5. EXPENSES: TRAVEL
    const fuelLiters = (gigData.dist || 100) / 100 * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PER_100KM;
    const fuelCost = Math.floor(fuelLiters * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE);
    report.expenses.breakdown.push({ label: 'Fuel', value: fuelCost, detail: `${gigData.dist || 100}km` });
    report.expenses.total += fuelCost;

    // 6. EXPENSES: FOOD & DRINK
    const bandSize = 3; 
    // Catering logic: If modifier is catering, we pay EXTRA for quality catering or we assume venue pays?
    // Usually catering modifier means "We bought catering" (better food) -> Costs more.
    // Or "Venue provided catering" (free)?
    // Context implies user spends budget on modifiers. So catering modifier = cost.
    let foodCost = bandSize * EXPENSE_CONSTANTS.FOOD.FAST_FOOD; 
    report.expenses.breakdown.push({ label: 'Food & Drinks', value: foodCost, detail: 'Subsistence' });
    report.expenses.total += foodCost;

    if (modifiers.catering) {
        // Upgrade to Restaurant/Catering quality
        const cateringCost = bandSize * (EXPENSE_CONSTANTS.FOOD.RESTAURANT - EXPENSE_CONSTANTS.FOOD.FAST_FOOD);
        report.expenses.breakdown.push({ label: 'Catering Upgrade', value: cateringCost, detail: 'Better food' });
        report.expenses.total += cateringCost;
    }

    // 7. EXPENSES: PROMO
    if (modifiers.promo) {
        const promoCost = 50; 
        report.expenses.breakdown.push({ label: 'Social Ads', value: promoCost, detail: 'Promo Campaign' });
        report.expenses.total += promoCost;
    }

    // 8. SPONSORSHIP BONUSES
    if (gigStats) {
        if (gigStats.misses === 0) {
            const bonus = 200;
            report.income.breakdown.push({ label: 'Tech Sponsor', value: bonus, detail: 'Perfect Set (0 Misses)' });
            report.income.total += bonus;
        }
        if (gigStats.peakHype >= 100) {
            const bonus = 150;
            report.income.breakdown.push({ label: 'Beer Sponsor', value: bonus, detail: 'Max Hype Reached' });
            report.income.total += bonus;
        }
    }

    report.net = report.income.total - report.expenses.total;
    return report;
};
