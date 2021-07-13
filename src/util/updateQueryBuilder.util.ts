import { IPreparedQuery } from 'src/database/interfaces/database.interface';

/**
 * - takes a table, an update DTO, and params and dynamically builds the query
 *
 * @export
 * @param {string} tableName - name of the table
 * @param {*} updateDto - an update DTO object with columns to update
 * @param {string} params - a string of any WHERE clause to append to the end
 * @return {*}  - returns an object of a pre-built query
 */
export function buildUpdateQuery(
	tableName: string,
	updateDto: any,
	params: string,
): IPreparedQuery {
	let query = `update ${tableName} set`;
	const values = [];

	//determine which columns we need to update... if they're blank, ignore them
	Object.keys(updateDto).forEach((col, idx) => {
		if (updateDto[col]) {
			query += ` ${col} = $${idx + 1}`;
			values[idx] = updateDto[col];
		}
	});

	if (params) {
		query += ` WHERE ${params}`;
	}

	query += ' returning *';

	return { name: `update-${tableName}`, text: query, values: values };
}
