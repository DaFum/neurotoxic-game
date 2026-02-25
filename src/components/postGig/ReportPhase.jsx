import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { ActionButton } from '../../ui/shared'

const FinancialList = ({ items, type }) => (
  <ul className='space-y-2.5 text-sm font-mono'>
    {items.map((item, i) => (
      <motion.li
        key={`${item.label}-${i}`}
        initial={{ opacity: 0, x: type === 'income' ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 + i * 0.1 }}
        className='flex justify-between items-center'
      >
        <span className='text-(--star-white)/70'>{item.label}</span>
        <span
          className={`${type === 'income' ? 'text-(--toxic-green)' : 'text-(--blood-red)'} font-bold tabular-nums`}
        >
          {type === 'income' ? '+' : '-'}{item.value}€
        </span>
      </motion.li>
    ))}
  </ul>
)

export const ReportPhase = ({ financials, onNext }) => {
  if (!financials) {
    return <div className="text-center font-mono animate-pulse">Loading Report...</div>
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-8'>
        {/* Income Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className='text-lg border-b-2 border-(--toxic-green) mb-4 pb-2 tracking-widest font-mono text-(--toxic-green)'>
            INCOME
          </h3>
          <FinancialList items={financials.income.breakdown} type="income" />
          <div className='mt-4 pt-2 border-t border-(--toxic-green)/40 flex justify-between font-bold text-(--toxic-green)'>
            <span className='text-sm tracking-wider'>TOTAL</span>
            <span className='tabular-nums'>{financials.income.total}€</span>
          </div>
        </motion.div>

        {/* Expenses Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className='text-lg border-b-2 border-(--blood-red) text-(--blood-red) mb-4 pb-2 tracking-widest font-mono'>
            EXPENSES
          </h3>
          <FinancialList items={financials.expenses.breakdown} type="expense" />
          <div className='mt-4 pt-2 border-t border-(--blood-red)/40 flex justify-between font-bold text-(--blood-red)'>
            <span className='text-sm tracking-wider'>TOTAL</span>
            <span className='tabular-nums'>{financials.expenses.total}€</span>
          </div>
        </motion.div>
      </div>

      {/* Net Result */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        className='text-center py-6 border-y-2 border-(--ash-gray)/30'
      >
        <div className='text-[10px] text-(--ash-gray) tracking-widest mb-2'>
          NET PROFIT
        </div>
        <div
          className={`text-5xl font-bold font-(--font-display) tabular-nums ${
            financials.net >= 0
              ? 'text-(--toxic-green) drop-shadow-[0_0_20px_var(--toxic-green)]'
              : 'text-(--blood-red) drop-shadow-[0_0_20px_var(--blood-red)]'
          }`}
        >
          {financials.net > 0 ? '+' : ''}
          {financials.net}€
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className='text-center'
      >
        <ActionButton
          onClick={onNext}
          variant='primary'
          className='px-8 py-3 text-(--void-black)'
        >
          Continue to Socials &gt;
        </ActionButton>
      </motion.div>
    </div>
  )
}

const FINANCIAL_CATEGORY_SHAPE = PropTypes.shape({
  total: PropTypes.number.isRequired,
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      detail: PropTypes.string
    })
  ).isRequired
})

ReportPhase.propTypes = {
  financials: PropTypes.shape({
    income: FINANCIAL_CATEGORY_SHAPE.isRequired,
    expenses: FINANCIAL_CATEGORY_SHAPE.isRequired,
    net: PropTypes.number.isRequired
  }),
  onNext: PropTypes.func.isRequired
}
