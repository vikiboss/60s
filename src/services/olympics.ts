import { wrapperBaseRes } from "../utils.ts";

const olympicsMedalApi = {
	en: "https://sph-i-api.olympics.com/summer/info/api/ENG/widgets/medals-table",
	zh: "https://sph-i-api.olympics.com/summer/info/api/CHI/widgets/medals-table",
};

export interface NationItem {
	noc: string;
	description: string;
	longDescription: string;
	rank: number;
	sortRank: number;
	rankTotal: number;
	sortTotalRank: number;
	nocSlug: string;
	gold: number;
	silver: number;
	bronze: number;
	total: number;
	disciplines: null;
}

let lastFetchTime = Date.now();
let cache = [] as NationItem[];

export async function fetchOlympics(type = "json") {
	if (!cache.length || Date.now() - lastFetchTime >= 1000 * 30) {
		lastFetchTime = Date.now();

		const [enData, zhData] = await Promise.all([
			await (await fetch(olympicsMedalApi.en)).json(),
			await (await fetch(olympicsMedalApi.zh)).json(),
		]);

		cache = (zhData.medalsTable as NationItem[])
			.map((e) => {
				const matched = (enData.medalsTable as NationItem[]).find(
					(i) => i.noc === e.noc,
				) as NationItem;

				return {
					...e,
					enDescription: matched.description,
					enLongDescription: matched.longDescription,
				};
			})
			.sort((a, b) => a.rank - b.rank);
	}

	const list = cache.map((e) => ({
		...e,
		flagUrl: `https://gstatic.olympics.com/s1/t_original/static/noc/oly/3x2/180x120/${e.noc}.png`,
	}));

	return type === "json"
		? wrapperBaseRes(list)
		: list
				.map((e, idx) => {
					const { gold, silver, bronze, total } = e;
					return `${idx + 1}. ${e.description} - 🏅️: ${gold}, 🥈: ${silver}, 🥉: ${bronze}, 共 ${total} 枚`;
				})
				.join("\n");
}
