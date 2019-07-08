import { ECMDatabase, ECMQuery } from "../index";
import { User, UserProps } from "./User";
import { ECSQLCMDQuery } from "@elijahjcobb/sql-cmd";
import { ECArray } from "@elijahjcobb/collections";

ECMDatabase.init({
	database: "maria",
	password: "alpine"
});

describe("Objects", () => {

	let createdId: string | undefined;

	test("Creating Object", async () => {

		let u: User = new User();

		u.props.name = "Millionare";
		u.props.age = 1_000_000;

		await u.create();
		createdId = u.id;

		expect(u.id).toBeDefined();

	});

	test("Get Object", async () => {

		if (createdId === undefined) return;
		expect((await ECMQuery.getObjectWithId(User, createdId)).id).toBeDefined();

	});

	test("Updating Prop", async() => {

		if (createdId === undefined) return;
		let u: User = await ECMQuery.getObjectWithId(User, createdId);

		u.props.age = 1;
		await u.updateProps("age");

		expect((await ECMQuery.getObjectWithId(User, createdId)).props.age).toEqual(1);

	});

	test("Updating Everything", async() => {

		if (createdId === undefined) return;
		let u: User = await ECMQuery.getObjectWithId(User, createdId);

		u.props.age = 1;
		u.props.name = "Little Dude";
		await u.update();

		expect((await ECMQuery.getObjectWithId(User, createdId)).props.age).toEqual(1);

	});

	test("Delete", async() => {

		if (createdId === undefined) return;
		let u: User = await ECMQuery.getObjectWithId(User, createdId);

		await u.delete();

		expect((await ECMQuery.getObjectWithId(User, createdId, true))).toEqual(undefined);

	});

});

describe("Queries", () => {

	test("One Condition", async() => {

		let query: ECMQuery<User, UserProps> = new ECMQuery(
			User,
			ECSQLCMDQuery
				.and()
				.where("age", ">", 18)
		);
		let users: ECArray<User> = await query.getAllObjects();

		expect(users.size()).toEqual(3);

	});

	test("Multiple Condition", async() => {

		let query: ECMQuery<User, UserProps> = new ECMQuery(
			User,
			ECSQLCMDQuery
				.and()
				.where("age", ">", 18)
				.where("age", "<", 51)
		);
		let users: ECArray<User> = await query.getAllObjects();

		expect(users.size()).toEqual(2);

	});

	test("Multiple Condition", async() => {

		let query: ECMQuery<User, UserProps> = new ECMQuery(
			User,
			ECSQLCMDQuery
				.or()
				.whereThese(
					ECSQLCMDQuery.and()
						.where("age", ">", 18)
						.where("age", "<", 51)
				)
				.where("age", "=", "15")
		);
		let users: ECArray<User> = await query.getAllObjects();

		expect(users.size()).toEqual(3);

	});

	test("Sub Query", async() => {

		let query: ECMQuery<User, UserProps> = new ECMQuery(
			User,
			ECSQLCMDQuery
				.and()
				.whereKeyIsValueOfQuery("id", "subTest", "id", "MntUcI5eMTF8IYAH")
		);
		let user: User = await query.getFirstObject();

		expect(user.props.name).toEqual("Ari");

	});

});