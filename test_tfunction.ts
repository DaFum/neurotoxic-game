import { TFunction } from 'i18next'
const t: TFunction<['ui'], undefined> = ((key: string) => key) as any;
console.log(t("ui:stats.fame"));
