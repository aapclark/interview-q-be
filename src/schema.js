const { gql } = require('apollo-server');

const typeDefs = gql`
	# The Query type lists all the different queries (Retrieve operations) that front-end can make from this Endpoint
	# We can name these whatever we want. "Banana" words
	extend type Query {
		interviewQinfo: String!
		posts(
			industry: String
			price: String
			orderBy: String
      tags: String
      ids: [String]
		): [Post!]!
		post(id: String!): Post!
		postByCoach(coach_id: String!): Post!
		industries: [Industry]!
		industry(name: String!): [Post!]!
		availabilities: [Availability]
		availabilitiesByCoach(coach_id: String!): [Availability]
		bookings: [Booking]
		bookingsByCoach(coach_id: String!): [Booking]
		bookingsBySeeker(seeker_id: String!): [Booking]
	}

	# ***************************************************

	# The Mutation type lists all the different CUD (Create, Update, Delete) operations that front-end can make from this Endpoint
	type Mutation {
		createPost(
			price: Int
			position: String
			industryName: String
			description: String
			tagString: String
			company: String
			isPublished: Boolean!
		): Post!

		deletePost: Post!

		updatePost(
			id: ID!
			price: Int
			position: String
			industryName: String
			description: String
			tagString: String
			company: String
			isPublished: Boolean
		): Post!

		removeTagFromPost(id: ID!, tag: String): Post!

		createAvailability(
			start_hour: Int!
			start_minute: Int!
			# coach: String!
			# bookingId: String
			year: Int!
			month: Int!
			day: Int!
		): Availability!

		deleteAvailability(id: ID!): Availability!

		createBooking(
			year: Int!
			month: Int!
			day: Int!
			hour: Int!
			minute: Int!
			coach: String!
			# seeker: String!
			availabilityA: String!
			availabilityB: String!
			pending: Boolean
			confirmed: Boolean
		): Booking!

		deleteBooking(id: ID!): Booking!
	}

	# ***************************************************

	# All of the types below are ones that we create and are what make up the different tables in our Prisma database.

	# Every created type needs an ID, which will be a random string of characters generated by Prisma

	#The datamodel.prisma file should match this part, although that file includes @id for every primary key ID
	scalar DateTime

	type Post {
		id: ID!
		price: Int!
		position: String!
		# A post is connected to one industry. We connect them via a String of the unique name of the industry
		# An alternate method could be connecting them via ID, but since both are unique, we chose name
		industry: Industry!
		description: String!
		tags: [Tag]!
		coach: User!
		company: String!
		isPublished: Boolean!
		createdAt: DateTime!
		lastUpdated: DateTime!
	}

	type Availability {
		id: ID!
		start_hour: Int!
		start_minute: Int!
		coach: User!
		bookingID: String
		year: Int!
		month: Int!
		day: Int!
		uniquecheck: String!
		isOpen: Boolean!
		recurring: Boolean!
	}

	type Booking {
		id: ID!
		year: Int!
		month: Int!
		day: Int!
		hour: Int!
		minute: Int!
		coach: User!
		seeker: User!
		uniquecheck: String!
		availability: [Availability]!
		pending: Boolean
		confirmed: Boolean
	}

	extend type User @key(fields: "id") {
		id: ID! @external
		post: Post
		availability: [Availability]
		coach_bookings: [Booking]
		seeker_bookings: [Booking]
	}

	type Industry {
		id: ID!
		name: String!
		posts: [Post]! # This is how GraphQL connects the Industry type with the Post type... it designates a key for an industry object that references an array of matching Posts

		# This is a one to many relationship between Industry and Post
	}

	type Tag {
		id: ID!
		name: String!
		posts: [Post]!
	}
`;

module.exports = typeDefs;
