module.exports = {
	createPost,
	deletePost,
	updatePost,
	deleteIndustry,
	updateIndustry,
	removeTagFromPost,
	createAvailability,
	deleteAvailability,
	createBooking,
	deleteBooking,
	createReview,
	updateReview,
	deleteReview,
	createResponse,
	updateResponse,
	deleteResponse,
	createReport,
	updateReport,
};

const { checkFields, splitAndTrimTags, getUserId } = require('../utils');

// Mutations/Operations for Post
async function createPost(_parent, args, context) {
	let {
		price,
		position,
		industryName,
		description,
		tagString,
		company,
		isPublished,
	} = args;
	const coachID = getUserId(context);
	if (isPublished) {
		checkFields({ position, industryName, description, company });
	}
	let company_lc;
	let desc_lc;
	let position_lc;
	if (company) {
		company_lc = company.toLowerCase();
	}
	if (description) {
		desc_lc = description.toLowerCase();
	}
	if (position) {
		position_lc = position.toLowerCase();
	}

	if (tagString) {
		tagString = tagString.toLowerCase();
		const tagArray = splitAndTrimTags(tagString);
		const tagsObjArray = await addNewTags(tagArray, context);

		return Promise.all(tagsObjArray).then(tags => {
			return context.prisma.createPost({
				price,
				position,
				position_lc,
				description,
				desc_lc,
				coachID,
				company,
				company_lc,
				isPublished,
				industry: { connect: { name: industryName } },
				tags: { connect: tagArray },
			});
		});
	} else {
		return context.prisma.createPost({
			price,
			position,
			position_lc,
			description,
			desc_lc,
			coachID,
			company,
			company_lc,
			isPublished,
			industry: { connect: { name: industryName } },
		});
	}
}

async function deletePost(_parent, _args, context) {
	const id = getUserId(context);
	let foundPostTags = await context.prisma
		.post({ coachID: id })
		.tags()
		.id();
	updatedPost = await context.prisma.deletePost({ coachID: id });
	deleteDisconnectedTags(context, foundPostTags);
	return updatedPost;
}

async function updatePost(_parent, args, context) {
	let {
		id,
		price,
		position,
		description,
		industryName,
		tagString,
		company,
		isPublished,
	} = args;
	// if (tagString && industryName) {
	//   tagString = tagString.toLowerCase();
	// 	const tagArray = splitAndTrimTags(tagString);
	//   const tagsObjArray = await addNewTags(tagArray, context);
	//   return await context.prisma.updatePost({
	//     data: {
	//       price,
	//       position,
	//       description,
	//       company,
	//       isPublished,
	//       industry: { connect: { name: industryName } },
	//       tags: { connect: tagArray },
	//     },
	//     where: {
	//       id,
	//     },
	//   });
	// } else
	if (tagString) {
		tagString = tagString.toLowerCase();
		const tagArray = splitAndTrimTags(tagString);
		const tagsObjArray = await addNewTags(tagArray, context);
		return await context.prisma.updatePost({
			data: {
				price,
				position,
				description,
				company,
				isPublished,
				tags: { connect: tagArray },
			},
			where: {
				id,
			},
		});
	} else if (industryName) {
		return await context.prisma.updatePost({
			data: {
				price,
				position,
				description,
				isPublished,
				company,
				industry: { connect: { name: industryName } },
			},
			where: {
				id,
			},
		});
	} else {
		//If no industry and tagname
		let company_lc;
		let desc_lc;
		let position_lc;
		if (company) {
			company_lc = company.toLowerCase();
		}
		if (description) {
			desc_lc = description.toLowerCase();
		}
		if (position) {
			position_lc = position.toLowerCase();
		}
		return await context.prisma.updatePost({
			data: {
				price,
				position,
				position_lc,
				description,
				desc_lc,
				isPublished,
				company,
				company_lc,
			},
			where: {
				id,
			},
		});
	}
}

// Mutations/Operations for Industry
function deleteIndustry(_parent, args, context) {
	return context.prisma.deleteIndustry({ id: args.id });
}

function updateIndustry(_parent, args, context) {
	return context.prisma.updateIndustry({
		data: { args },
		where: {
			id,
		},
	});
}

async function removeTagFromPost(_parent, args, context) {
	const { id, tagID } = args;

	const updatedPost = await context.prisma.updatePost({
		data: { tags: { disconnect: { id: tagID } } },
		where: { id },
	});
	await deleteDisconnectedTags(context, [{ id: tagID }]);
	return updatedPost;
}

// Mutations/Operations for Tag
function addNewTags(array, context) {
	return array.map(async tag => {
		return await context.prisma.upsertTag({
			where: {
				name: tag.name,
			},
			create: {
				name: tag.name,
			},
			update: {
				name: tag.name,
			},
		});
	});
}

function deleteDisconnectedTags(context, tags) {
	return Promise.all(
		tags.map(async tag => {
			if (
				(await context.prisma
					.postsConnection({ where: { tags_some: { id: tag.id } } })
					.aggregate()
					.count()) === 0
			) {
				return await context.prisma.deleteTag({ id: tag.id });
			}
		}),
	);
}

// Mutations/Operations for Availibilities
async function createAvailability(_parent, args, context) {
	const { year, month, day, start_hour, start_minute } = args;
	const coach = getUserId(context);

	const uniquecheck = [
		coach,
		year,
		month,
		day,
		start_hour,
		start_minute,
	].reduce((acc, val) => acc + '-' + val);

	return context.prisma.createAvailability({
		...args,
		coach,
		isOpen: true,
		uniquecheck,
	});
}

function deleteAvailability(_parent, args, context) {
	return context.prisma.deleteAvailability({ uniquecheck: args.uniquecheck });
}

// Mutations/Operations for Bookings
async function createBooking(_parent, args, context) {
	const {
		year,
		month,
		day,
		hour,
		minute,
		coach,
		interviewGoals,
		interviewQuestions,
		resumeURL,
	} = args;
	const seeker = getUserId(context);
	const uniquecheck = [coach, seeker, year, month, day, hour, minute].reduce(
		(acc, val) => acc + '-' + val,
	);

	await context.prisma.updateAvailability({
		data: { isOpen: false },
		where: { uniquecheck: args.availabilityA },
	});
	await context.prisma.updateAvailability({
		data: { isOpen: false },
		where: { uniquecheck: args.availabilityB },
	});

	return context.prisma.createBooking({
		year,
		month,
		day,
		hour,
		minute,
		coach,
		seeker,
		availability: {
			connect: [
				{ uniquecheck: args.availabilityA },
				{ uniquecheck: args.availabilityB },
			],
		},
		uniquecheck,
		interviewGoals,
		interviewQuestions,
		resumeURL,
	});
}

async function deleteBooking(_parent, args, context) {
	const availability = await context.prisma
		.booking({
			uniquecheck: args.uniquecheck,
		})
		.availability();

	await context.prisma.updateAvailability({
		data: { isOpen: true },
		where: { uniquecheck: availability[0].uniquecheck },
	});
	await context.prisma.updateAvailability({
		data: { isOpen: true },
		where: { uniquecheck: availability[1].uniquecheck },
	});

	return context.prisma.deleteBooking({ uniquecheck: args.uniquecheck });
}

// Mutations for Reviews
async function createReview(_parent, args, context) {
	const { uniqueBooking, rating, review } = args;

	const booking = await context.prisma.booking({ uniquecheck: uniqueBooking });

	const post = await context.prisma.post({ coachID: booking.coach });

	return context.prisma.createReview({
		coach: booking.coach,
		seeker: booking.seeker,
		booking: {
			connect: { uniquecheck: uniqueBooking },
		},
		rating,
		review,
		post: {
			connect: { id: post.id },
		},
	});
}

function updateReview(_parent, args, context) {
	return context.prisma.updateReview({
		data: { args },
		where: {
			id,
		},
	});
}

function deleteReview(_parent, args, context) {
	return context.prisma.deleteReview({ id: args.id });
}

// Mutations for Responses
function createResponse(_parent, args, context) {
	const { reviewID, uniqueBooking, text } = args;

	return context.prisma.createReview({
		review: {
			connect: { id: reviewID },
		},
		text,
		booking: {
			connect: { uniquecheck: uniqueBooking },
		},
	});
}

function updateResponse(_parent, args, context) {
	return context.prisma.updateResponse({
		data: { args },
		where: { id },
	});
}

function deleteResponse(_parent, args, context) {
	return context.prisma.deleteResponse({ id: args.id });
}

// Mutations for Reports
async function createReport(_parent, args, context) {
	const {
		uniqueBooking,
		strengths,
		growthAreas,
		suggestions,
		additionalComments,
		isSent,
	} = args;

	const booking = await context.prisma.booking({ uniquecheck: uniqueBooking });

	return context.prisma.createReport({
		coach: booking.coach,
		seeker: booking.seeker,
		booking: {
			connect: { uniquecheck: uniqueBooking },
		},
		strengths,
		growthAreas,
		suggestions,
		additionalComments,
		isSent,
	});
}

function updateReport(_parent, args, context) {
	return context.prisma.updateReport({
		data: { args },
		where: { id },
	});
}
