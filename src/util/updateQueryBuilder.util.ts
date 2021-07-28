import { IPreparedQuery } from 'src/database/interfaces/database.interface';
import { ParametersRequiredError } from 'src/errors/errors';

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
  userId: number,
  queryIdentifier?: string,
): IPreparedQuery {
  //first, let's check for fields to update
  if (Object.keys(updateDto).length < 1) {
    throw new ParametersRequiredError(
      `Unable to find parameters to update for this user.  Please make sure you're sending the right parameters in your request.`,
    );
  }

  let query = `update ${tableName} set`;
  const values = [];

  //determine which columns we need to update... if they're blank, ignore them
  Object.keys(updateDto).forEach((col, idx) => {
    if (updateDto[col] && idx == 0) {
      query += ` ${col} = $${idx + 1}`;
      values[idx] = updateDto[col];
    } else {
      query += `, ${col} = $${idx + 1}`;
      values[idx] = updateDto[col];
    }
  });

  //next, let's add in our updated_by to be our user
  query += `, updated_by = ${userId}`;

  if (params) {
    query += ` WHERE ${params}`;
  }

  query += ' returning *';

  return {
    name: `update-${tableName}${queryIdentifier ? '-' + queryIdentifier : ''}`,
    text: query,
    values: values,
  };
}
