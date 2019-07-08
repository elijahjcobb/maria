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

import { ECDictionary } from "@elijahjcobb/collections";
import { ECError, ECErrorOriginType, ECErrorStack, ECErrorType } from "@elijahjcobb/error";

/**
 * A class to handle duplication errors on a column marked as unique.
 *
 * This class will be abstracted in a later version to allow custom keys other than the ones currently provided.
 */
export class ECMDuplicateKeyHelper {

	private readonly keys: ECDictionary<string, string> = new ECDictionary<string, string>();

	/**
	 * Create a new ECSQLDuplicateKeyHelper instance.
	 */
	public constructor(keys: { [key: string]: string } | undefined) {

		if (keys) this.keys = ECDictionary.initWithNativeObject(keys);

	}

	/**
	 * Get the error stack that should be created from the offending key.
	 * @param {object} error The error object.
	 * @return {ECErrorStack} An ECErrorStack instance.
	 */
	public getErrorStack(error: object): ECErrorStack {

		let stack: ECErrorStack = new ECErrorStack();
		stack.addError(this.getError(error));
		return stack;

	}

	/**
	 * Ger the error that should be created from the offending key.
	 * @param {object} error The error object.
	 * @return {ECError} An ECError instance.
	 */
	public getError(error: object): ECError {

		// @ts-ignore
		let message: string = error["sqlMessage"];
		let duplicatedKey: string = message.substring(
			message.indexOf("key '") + 5,
			message.length - 1).toLowerCase();
		let keyToUse: string = duplicatedKey;
		if (this.keys.containsKey(duplicatedKey)) keyToUse = this.keys.get(duplicatedKey);

		return new ECError(
			ECErrorOriginType.User,
			ECErrorType.ValueAlreadyExists,
			new Error(`This value already exists for key: '${keyToUse}'.`));

	}

}