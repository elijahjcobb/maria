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

import { ECMDuplicateKeyHelper } from "./ECMDuplicateKeyHelper";
import * as SQL from "mysql";
import { ECErrorStack, ECErrorOriginType, ECErrorType } from "@elijahjcobb/error";

/**
 * A type safe object to initialize a new database instance.
 */
export type ECMInitObject = {
	host?: string,
	username?: string,
	password?: string,
	database: string,
	port?: number,
	verbose?: boolean,
	duplicateKeys?: { [key: string]: string }
	insecureAuth?: boolean
};

/**
 * A class to communicate with a SQL database.
 */
export class ECMDatabase {

	private static databasePool: SQL.Pool;
	private static databaseName: string;
	private static duplicateKeys: { [key: string]: string } | undefined;
	public static verbose: boolean;

	/**
	 * Query the database.
	 * @param {string} command The command to be sent to the database.
	 * @return {Promise} A promise containing type any.
	 */
	public static async query(command: string): Promise<any> {

		if (!ECMDatabase.databasePool) {
			console.error("You must call ECMDatabase.init() before you can access your SQL server.");
			process.exit(0);
		}

		if (this.verbose) console.log(`Running SQL Command: '${command}'.`);

		return new Promise((resolve: Function, reject: Function): void => {

			ECMDatabase.databasePool.query(command, (error: object, results: object[]) => {

				if (!error) {

					resolve(results);

				} else {

					reject(ECMDatabase.handleError(error));

				}

			});

		});

	}

	/**
	 * Handle errors and wrap when needed.
	 * @param {object} error The error object.
	 * @return {ECErrorStack | boolean} Returns an ACErrorStack instance or a boolean if the offending error was a
	 * primary key index. Primary keys are provided with key "id" and offending duplicates are handled internally.
	 */
	public static handleError(error: object): ECErrorStack | boolean {

		// @ts-ignore
		let code: number | string = error["errno"];
		// @ts-ignore
		let sqlMessage: string = error["sqlMessage"];
		// @ts-ignore
		let message: string = error["message"];

		let stack: ECErrorStack = new ECErrorStack();

		if (code === 1062) {


			if (sqlMessage.indexOf("'PRIMARY'") !== -1) {

				return true;

			} else {

				stack.addError(new ECMDuplicateKeyHelper(ECMDatabase.duplicateKeys).getError(error));

			}

		} else {

			if (code === "ECONNREFUSED") {
				stack.add(
					ECErrorOriginType.SQLServer,
					ECErrorType.InternalSQLError,
					new Error("The SQL Database is not online."));
			} else {
				stack.add(
					ECErrorOriginType.SQLServer,
					ECErrorType.InternalSQLError,
					new Error(`Code: ${code}, SQLMessage: ${sqlMessage}, Message: ${message}`));
			}

			stack.add(
				ECErrorOriginType.SQLServer,
				ECErrorType.InternalSQLError,
				new Error("Internal Database Error."));
		}

		return stack;
	}

	/**
	 * A helper method to initialize the communication with the database.
	 * @param {ECMInitObject} initObject The initialization object.
	 */
	public static init(initObject: ECMInitObject): void {

		if (initObject.insecureAuth === undefined) initObject.insecureAuth = false;

		ECMDatabase.databasePool = SQL.createPool({
			connectionLimit: 100,
			host: initObject.host || "localhost",
			user: initObject.username || "root",
			password: initObject.password || "",
			database: initObject.database,
			port: initObject.port || 3306,
			insecureAuth: initObject.insecureAuth
		});

		if (initObject.duplicateKeys) ECMDatabase.duplicateKeys = initObject.duplicateKeys;
		if (initObject.verbose) ECMDatabase.verbose = true;
		ECMDatabase.databaseName = initObject.database;

	}

}