/**
 *
 * Elijah Cobb
 * elijah@elijahcobb.com
 * https://elijahcobb.com
 *
 *
 * Copyright 2019 Elijah Cobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import { ECMObject, ECMObjectPropType } from "./ECMObject";
import { ECArray, ECArrayList } from "@elijahjcobb/collections";
import { ECSQLCMD, ECSQLCMDQuery } from "@elijahjcobb/sql-cmd";
import { ECMDatabase } from "./ECMDatabase";
import { ECMResponse } from "./ECMResponse";


export type ECMQueryFactory<T, P> = { new<P>(): T };

/**
 * A class that queries the SQL database from filter, a sort, limit, and conditionals.
 */
export class ECMQuery<Type extends ECMObject<Props>, Props extends ECMObjectPropType> {

	private readonly table: string;
	private readonly factory: ECMQueryFactory<Type, Props>;
	private query: ECSQLCMDQuery;

	/**
	 * Create a new query instance
	 * @param type A class that extends ECMObject
	 * @param query A query.
	 */
	public constructor(type: ECMQueryFactory<Type, Props>, query: ECSQLCMDQuery) {


		this.query = query;
		this.factory = type;
		this.table = (new this.factory()).table;

	}

	/**
	 * Get the first object from the query instance.
	 * @param {boolean} allowUndefined Whether or not an error should be thrown if the object is undefined.
	 * @return {Promise<ECMResponse>} A promise containing a ECMResponse instance.
	 */
	public async getFirstObject(allowUndefined?: boolean): Promise<Type> {

		const items: ECArray<Type> = await this.getAllObjects(1);
		return items.get(0);

	}

	/**
	 * Get all objects that follow the specified query.
	 * @return {Promise<ECArray<ECMResponse>>} A promise returning an ECArray of ECMResponse instances.
	 */
	public async getAllObjects(count: number = -1): Promise<ECArray<Type>> {

		let command: ECSQLCMD = ECSQLCMD.select(this.table).whereThese(this.query);
		if (count !== -1) command = command.limit(count);

		let objects: object[] = await ECMDatabase.query(command.generate());
		let responsesUnformed: ECArrayList<ECMResponse> = new ECArrayList<ECMResponse>();
		objects.forEach((object: object) => responsesUnformed.add(new ECMResponse(this.table, object)));

		let responses: ECArrayList<Type> = new ECArrayList<Type>();

		await responsesUnformed.forEachSync(async (response: ECMResponse) => {

			let object: Type = new this.factory();
			await object.decode(response.getContent());
			responses.add(object);

		});

		return responses.toArray();

	}

	/**
	 * Count how many objects follow the specified query.
	 * @return {Promise<number>} A promise containing a number.
	 */
	public async count(): Promise<number> {

		let command: ECSQLCMD = ECSQLCMD.count(this.table).whereThese(this.query);
		let responses: object[] = await ECMDatabase.query(command.generate());
		let responseObject: object = responses[0];

		// @ts-ignore
		return responseObject["COUNT(*)"];
	}

	/**
	 * Check if the query returns any objects at all.
	 * @return {Promise<boolean>} A promise containing a boolean.
	 */
	public async exists(): Promise<boolean> {

		return (await this.count()) > 0;

	}

	/**
	 * Get an object with a specific id.
	 * @param type The class of the object.
	 * @param id The id of the object.
	 * @param allowUndefined Whether an error should be thrown if the object can not be found.
	 */
	public static async getObjectWithId<T extends ECMObject<P>, P extends ECMObjectPropType>(type: ECMQueryFactory<T, P>, id: string, allowUndefined?: boolean): Promise<T> {

		let query: ECMQuery<T, P> = new ECMQuery<T, P>(type, ECSQLCMDQuery.and().where("id", "=", id));
		return await query.getFirstObject(allowUndefined);

	}

}