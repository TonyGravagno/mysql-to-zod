import { filterTable } from "./getTablesUtil";

describe("filterTable", () => {
	it("case1 posts", () => {
		const configTableNameList = ["posts"];
		const tableName = "posts";
		expect(filterTable({ configTableNameList, tableName })).toBeTruthy();
	});
});
