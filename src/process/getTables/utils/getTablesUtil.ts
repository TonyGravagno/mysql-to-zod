type FilterTableProps = {
	configTableNameList: string[];
	tableName: string;
};
export const filterTable = ({
	configTableNameList,
	tableName,
}: FilterTableProps): boolean => {
	if (configTableNameList.length === 0) return true;
	return configTableNameList.includes(tableName);
};
