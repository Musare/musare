import async from "async";

import { isAdminRequired, isLoginRequired } from "./hooks";

import moduleManager from "../../index";

const DBModule = moduleManager.modules.db;
const UtilsModule = moduleManager.modules.utils;
const WSModule = moduleManager.modules.ws;
const CacheModule = moduleManager.modules.cache;
const SongsModule = moduleManager.modules.songs;
const ActivitiesModule = moduleManager.modules.activities;
const YouTubeModule = moduleManager.modules.youtube;
const PlaylistsModule = moduleManager.modules.playlists;

CacheModule.runJob("SUB", {
	channel: "song.newUnverifiedSong",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", {
			modelName: "song"
		});
		songModel.findOne({ _id: songId }, (err, song) => {
			WSModule.runJob("EMIT_TO_ROOM", {
				room: "admin.unverifiedSongs",
				args: ["event:admin.unverifiedSong.added", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.removedUnverifiedSong",
	cb: songId => {
		WSModule.runJob("EMIT_TO_ROOM", {
			room: "admin.unverifiedSongs",
			args: ["event:admin.unverifiedSong.removed", songId]
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.updatedUnverifiedSong",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", {
			modelName: "song"
		});

		songModel.findOne({ _id: songId }, (err, song) => {
			WSModule.runJob("EMIT_TO_ROOM", {
				room: "admin.unverifiedSongs",
				args: ["event:admin.unverifiedSong.updated", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.newVerifiedSong",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		songModel.findOne({ _id: songId }, (err, song) => {
			WSModule.runJob("EMIT_TO_ROOM", {
				room: "admin.songs",
				args: ["event:admin.verifiedSong.added", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.removedVerifiedSong",
	cb: songId => {
		WSModule.runJob("EMIT_TO_ROOM", {
			room: "admin.songs",
			args: ["event:admin.verifiedSong.removed", songId]
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.updatedVerifiedSong",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		songModel.findOne({ _id: songId }, (err, song) => {
			WSModule.runJob("EMIT_TO_ROOM", {
				room: "admin.songs",
				args: ["event:admin.verifiedSong.updated", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.newHiddenSong",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", {
			modelName: "song"
		});
		songModel.findOne({ _id: songId }, (err, song) => {
			WSModule.runJob("EMIT_TO_ROOM", {
				room: "admin.hiddenSongs",
				args: ["event:admin.hiddenSong.added", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.removedHiddenSong",
	cb: songId => {
		WSModule.runJob("EMIT_TO_ROOM", {
			room: "admin.hiddenSongs",
			args: ["event:admin.hiddenSong.removed", songId]
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.updatedHiddenSong",
	cb: async songId => {
		const songModel = await DBModule.runJob("GET_MODEL", {
			modelName: "song"
		});

		songModel.findOne({ _id: songId }, (err, song) => {
			WSModule.runJob("EMIT_TO_ROOM", {
				room: "admin.hiddenSongs",
				args: ["event:admin.hiddenSong.updated", song]
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.like",
	cb: data => {
		WSModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.like",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});

		WSModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(sockets => {
			sockets.forEach(socket => {
				socket.dispatch("event:song.newRatings", {
					songId: data.songId,
					liked: true,
					disliked: false
				});
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.dislike",
	cb: data => {
		WSModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.dislike",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});
		WSModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(sockets => {
			sockets.forEach(socket => {
				socket.dispatch("event:song.newRatings", {
					songId: data.songId,
					liked: false,
					disliked: true
				});
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.unlike",
	cb: data => {
		WSModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.unlike",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});
		WSModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(sockets => {
			sockets.forEach(socket => {
				socket.dispatch("event:song.newRatings", {
					songId: data.songId,
					liked: false,
					disliked: false
				});
			});
		});
	}
});

CacheModule.runJob("SUB", {
	channel: "song.undislike",
	cb: data => {
		WSModule.runJob("EMIT_TO_ROOM", {
			room: `song.${data.songId}`,
			args: [
				"event:song.undislike",
				{
					songId: data.songId,
					likes: data.likes,
					dislikes: data.dislikes
				}
			]
		});
		WSModule.runJob("SOCKETS_FROM_USER", { userId: data.userId }).then(sockets => {
			sockets.forEach(socket => {
				socket.dispatch("event:song.newRatings", {
					songId: data.songId,
					liked: false,
					disliked: false
				});
			});
		});
	}
});

export default {
	/**
	 * Returns the length of the songs list
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param cb
	 */
	length: isAdminRequired(async function length(session, status, cb) {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);
		async.waterfall(
			[
				next => {
					songModel.countDocuments({ status }, next);
				}
			],
			async (err, count) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"SONGS_LENGTH",
						`Failed to get length from songs that have the status ${status}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}
				this.log(
					"SUCCESS",
					"SONGS_LENGTH",
					`Got length from songs that have the status ${status} successfully.`
				);
				return cb(count);
			}
		);
	}),

	/**
	 * Gets a set of songs
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param set - the set number to return
	 * @param cb
	 */
	getSet: isAdminRequired(async function getSet(session, set, status, cb) {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);
		async.waterfall(
			[
				next => {
					songModel
						.find({ status })
						.skip(15 * (set - 1))
						.limit(15)
						.exec(next);
				}
			],
			async (err, songs) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"SONGS_GET_SET",
						`Failed to get set from songs that have the status ${status}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}
				this.log("SUCCESS", "SONGS_GET_SET", `Got set from songs that have the status ${status} successfully.`);
				return cb(songs);
			}
		);
	}),

	/**
	 * Gets a song from the YouTube song id
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} songId - the YouTube song id
	 * @param {Function} cb
	 */
	getSong: isAdminRequired(function getSong(session, songId, cb) {
		async.waterfall(
			[
				next => {
					SongsModule.runJob("GET_SONG_FROM_ID", { songId }, this)
						.then(song => {
							next(null, song);
						})
						.catch(err => {
							next(err);
						});
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log("ERROR", "SONGS_GET_SONG", `Failed to get song ${songId}. "${err}"`);
					return cb({ status: "failure", message: err });
				}
				this.log("SUCCESS", "SONGS_GET_SONG", `Got song ${songId} successfully.`);
				return cb({ status: "success", data: song });
			}
		);
	}),

	/**
	 * Gets a song from the Musare song id
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} songId - the Musare song id
	 * @param {Function} cb
	 */
	getSongFromMusareId: isAdminRequired(function getSong(session, songId, cb) {
		async.waterfall(
			[
				next => {
					SongsModule.runJob("GET_SONG", { id: songId }, this)
						.then(response => next(null, response.song))
						.catch(err => next(err));
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log("ERROR", "SONGS_GET_SONG_FROM_MUSARE_ID", `Failed to get song ${songId}. "${err}"`);
					return cb({ status: "failure", message: err });
				}
				this.log("SUCCESS", "SONGS_GET_SONG_FROM_MUSARE_ID", `Got song ${songId} successfully.`);
				return cb({ status: "success", data: { song } });
			}
		);
	}),

	/**
	 * Obtains basic metadata of a song in order to format an activity
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} songId - the song id
	 * @param {Function} cb - callback
	 */
	getSongForActivity(session, songId, cb) {
		async.waterfall(
			[
				next => {
					SongsModule.runJob("GET_SONG_FROM_ID", { songId }, this)
						.then(response => next(null, response.song))
						.catch(next);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);

					this.log(
						"ERROR",
						"SONGS_GET_SONG_FOR_ACTIVITY",
						`Failed to obtain metadata of song ${songId} for activity formatting. "${err}"`
					);

					return cb({ status: "failure", message: err });
				}

				if (song) {
					this.log(
						"SUCCESS",
						"SONGS_GET_SONG_FOR_ACTIVITY",
						`Obtained metadata of song ${songId} for activity formatting successfully.`
					);

					return cb({
						status: "success",
						data: {
							title: song.title,
							thumbnail: song.thumbnail
						}
					});
				}

				this.log(
					"ERROR",
					"SONGS_GET_SONG_FOR_ACTIVITY",
					`Song ${songId} does not exist so failed to obtain for activity formatting.`
				);

				return cb({ status: "failure" });
			}
		);
	},

	/**
	 * Updates a song
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} songId - the song id
	 * @param {object} song - the updated song object
	 * @param {Function} cb
	 */
	update: isAdminRequired(async function update(session, songId, song, cb) {
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);
		let existingSong = null;
		async.waterfall(
			[
				next => {
					songModel.findOne({ _id: songId }, next);
				},

				(_existingSong, next) => {
					existingSong = _existingSong;
					songModel.updateOne({ _id: songId }, song, { runValidators: true }, next);
				},

				(res, next) => {
					SongsModule.runJob("UPDATE_SONG", { songId }, this)
						.then(song => {
							existingSong.genres
								.concat(song.genres)
								.filter((value, index, self) => self.indexOf(value) === index)
								.forEach(genre => {
									PlaylistsModule.runJob("AUTOFILL_GENRE_PLAYLIST", { genre })
										.then(() => {})
										.catch(() => {});
								});

							next(null, song);
						})
						.catch(next);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);

					this.log("ERROR", "SONGS_UPDATE", `Failed to update song "${songId}". "${err}"`);

					return cb({ status: "failure", message: err });
				}

				this.log("SUCCESS", "SONGS_UPDATE", `Successfully updated song "${songId}".`);

				if (song.status === "verified") {
					CacheModule.runJob("PUB", {
						channel: "song.updatedVerifiedSong",
						value: song._id
					});
				} else if (song.status === "unverified") {
					CacheModule.runJob("PUB", {
						channel: "song.updatedUnverifiedSong",
						value: song._id
					});
				} else if (song.status === "hidden") {
					CacheModule.runJob("PUB", {
						channel: "song.updatedHiddenSong",
						value: song._id
					});
				}

				return cb({
					status: "success",
					message: "Song has been successfully updated",
					data: song
				});
			}
		);
	}),

	// /**
	//  * Removes a song
	//  *
	//  * @param session
	//  * @param songId - the song id
	//  * @param cb
	//  */
	// remove: isAdminRequired(async function remove(session, songId, cb) {
	// 	const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);
	// 	let song = null;
	// 	async.waterfall(
	// 		[
	// 			next => {
	// 				songModel.findOne({ _id: songId }, next);
	// 			},

	// 			(_song, next) => {
	// 				song = _song;
	// 				songModel.deleteOne({ _id: songId }, next);
	// 			},

	// 			(res, next) => {
	// 				// TODO Check if res gets returned from above
	// 				CacheModule.runJob("HDEL", { table: "songs", key: songId }, this)
	// 					.then(() => {
	// 						next();
	// 					})
	// 					.catch(next)
	// 					.finally(() => {
	// 						song.genres.forEach(genre => {
	// 							PlaylistsModule.runJob("AUTOFILL_GENRE_PLAYLIST", { genre })
	// 								.then(() => {})
	// 								.catch(() => {});
	// 						});
	// 					});
	// 			}
	// 		],
	// 		async err => {
	// 			if (err) {
	// 				err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);

	// 				this.log("ERROR", "SONGS_REMOVE", `Failed to remove song "${songId}". "${err}"`);

	// 				return cb({ status: "failure", message: err });
	// 			}

	// 			this.log("SUCCESS", "SONGS_REMOVE", `Successfully remove song "${songId}".`);

	// 			if (song.verified) {
	// 				CacheModule.runJob("PUB", {
	// 					channel: "song.removedVerifiedSong",
	// 					value: songId
	// 				});
	// 			} else {
	// 				CacheModule.runJob("PUB", {
	// 					channel: "song.removedUnverifiedSong",
	// 					value: songId
	// 				});
	// 			}

	// 			return cb({
	// 				status: "success",
	// 				message: "Song has been successfully removed"
	// 			});
	// 		}
	// 	);
	// }),

	/**
	 * Requests a song
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} songId - the id of the song that gets requested
	 * @param {Function} cb - gets called with the result
	 */
	request: isLoginRequired(async function add(session, songId, cb) {
		SongsModule.runJob("REQUEST_SONG", { songId, userId: session.userId }, this)
			.then(() => {
				this.log(
					"SUCCESS",
					"SONGS_REQUEST",
					`User "${session.userId}" successfully requested song "${songId}".`
				);
				return cb({
					status: "success",
					message: "Successfully requested that song"
				});
			})
			.catch(async err => {
				err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
				this.log(
					"ERROR",
					"SONGS_REQUEST",
					`Requesting song "${songId}" failed for user ${session.userId}. "${err}"`
				);
				return cb({ status: "failure", message: err });
			});
	}),

	/**
	 * Hides a song
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} songId - the Musare id of the song that gets hidden
	 * @param {Function} cb - gets called with the result
	 */
	hide: isLoginRequired(async function add(session, songId, cb) {
		SongsModule.runJob("HIDE_SONG", { songId }, this)
			.then(() => {
				this.log("SUCCESS", "SONGS_HIDE", `User "${session.userId}" successfully hid song "${songId}".`);
				return cb({
					status: "success",
					message: "Successfully hid that song"
				});
			})
			.catch(async err => {
				err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
				this.log("ERROR", "SONGS_HIDE", `Hiding song "${songId}" failed for user ${session.userId}. "${err}"`);
				return cb({ status: "failure", message: err });
			});
	}),

	/**
	 * Unhides a song
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} songId - the Musare id of the song that gets hidden
	 * @param {Function} cb - gets called with the result
	 */
	unhide: isLoginRequired(async function add(session, songId, cb) {
		SongsModule.runJob("UNHIDE_SONG", { songId }, this)
			.then(() => {
				this.log("SUCCESS", "SONGS_UNHIDE", `User "${session.userId}" successfully unhid song "${songId}".`);
				return cb({
					status: "success",
					message: "Successfully unhid that song"
				});
			})
			.catch(async err => {
				err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
				this.log(
					"ERROR",
					"SONGS_UNHIDE",
					`Unhiding song "${songId}" failed for user ${session.userId}. "${err}"`
				);
				return cb({ status: "failure", message: err });
			});
	}),

	/**
	 * Verifies a song
	 *
	 * @param session
	 * @param song - the song object
	 * @param cb
	 */
	verify: isAdminRequired(async function add(session, songId, cb) {
		const SongModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);
		async.waterfall(
			[
				next => {
					SongModel.findOne({ songId }, next);
				},

				(song, next) => {
					if (!song) return next("This song is not in the database.");
					return next(null, song);
				},

				(song, next) => {
					song.acceptedBy = session.userId;
					song.acceptedAt = Date.now();
					song.status = "verified";
					song.save(err => {
						next(err, song);
					});
				},

				(song, next) => {
					song.genres.forEach(genre => {
						PlaylistsModule.runJob("AUTOFILL_GENRE_PLAYLIST", { genre })
							.then(() => {})
							.catch(() => {});
					});

					SongsModule.runJob("UPDATE_SONG", { songId: song._id });

					next(null, song);
				}
			],
			async (err, song) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);

					this.log("ERROR", "SONGS_VERIFY", `User "${session.userId}" failed to verify song. "${err}"`);

					return cb({ status: "failure", message: err });
				}

				this.log("SUCCESS", "SONGS_VERIFY", `User "${session.userId}" successfully verified song "${songId}".`);

				CacheModule.runJob("PUB", {
					channel: "song.newVerifiedSong",
					value: song._id
				});
				CacheModule.runJob("PUB", {
					channel: "song.removedUnverifiedSong",
					value: song._id
				});

				return cb({
					status: "success",
					message: "Song has been verified successfully."
				});
			}
		);
		// TODO Check if video is in queue and Add the song to the appropriate stations
	}),

	/**
	 * Un-verifies a song
	 *
	 * @param session
	 * @param songId - the song id
	 * @param cb
	 */
	unverify: isAdminRequired(async function add(session, songId, cb) {
		const SongModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);
		async.waterfall(
			[
				next => {
					SongModel.findOne({ _id: songId }, next);
				},

				(song, next) => {
					if (!song) return next("This song is not in the database.");
					return next(null, song);
				},

				(song, next) => {
					song.status = "unverified";
					song.save(err => {
						next(err, song);
					});
				},

				(song, next) => {
					song.genres.forEach(genre => {
						PlaylistsModule.runJob("AUTOFILL_GENRE_PLAYLIST", { genre })
							.then(() => {})
							.catch(() => {});
					});

					SongsModule.runJob("UPDATE_SONG", { songId: song._id });

					next(null);
				}
			],
			async err => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);

					this.log("ERROR", "SONGS_UNVERIFY", `User "${session.userId}" failed to verify song. "${err}"`);

					return cb({ status: "failure", message: err });
				}

				this.log(
					"SUCCESS",
					"SONGS_UNVERIFY",
					`User "${session.userId}" successfully unverified song "${songId}".`
				);

				CacheModule.runJob("PUB", {
					channel: "song.newUnverifiedSong",
					value: songId
				});

				CacheModule.runJob("PUB", {
					channel: "song.removedVerifiedSong",
					value: songId
				});

				return cb({
					status: "success",
					message: "Song has been unverified successfully."
				});
			}
		);
		// TODO Check if video is in queue and Add the song to the appropriate stations
	}),

	/**
	 * Requests a set of songs
	 *
	 * @param {object} session - the session object automatically added by the websocket
	 * @param {string} url - the url of the the YouTube playlist
	 * @param {boolean} musicOnly - whether to only get music from the playlist
	 * @param {Function} cb - gets called with the result
	 */
	requestSet: isLoginRequired(function requestSet(session, url, musicOnly, cb) {
		async.waterfall(
			[
				next => {
					YouTubeModule.runJob(
						"GET_PLAYLIST",
						{
							url,
							musicOnly
						},
						this
					)
						.then(res => {
							next(null, res.songs);
						})
						.catch(next);
				},
				(songIds, next) => {
					let successful = 0;
					let failed = 0;
					let alreadyInDatabase = 0;

					if (songIds.length === 0) next();

					async.eachLimit(
						songIds,
						1,
						(songId, next) => {
							WSModule.runJob(
								"RUN_ACTION2",
								{
									session,
									namespace: "songs",
									action: "request",
									args: [songId]
								},
								this
							)
								.then(res => {
									if (res.status === "success") successful += 1;
									else failed += 1;
									if (res.message === "This song is already in the database.") alreadyInDatabase += 1;
								})
								.catch(() => {
									failed += 1;
								})
								.finally(() => {
									next();
								});
						},
						() => {
							next(null, { successful, failed, alreadyInDatabase });
						}
					);
				}
			],
			async (err, response) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"REQUEST_SET",
						`Importing a YouTube playlist to be requested failed for user "${session.userId}". "${err}"`
					);
					return cb({ status: "failure", message: err });
				}
				this.log(
					"SUCCESS",
					"REQUEST_SET",
					`Successfully imported a YouTube playlist to be requested for user "${session.userId}".`
				);
				return cb({
					status: "success",
					message: `Playlist is done importing. ${response.successful} were added succesfully, ${response.failed} failed (${response.alreadyInDatabase} were already in database)`
				});
			}
		);
	}),

	// /**
	//  * Adds a song
	//  *
	//  * @param session
	//  * @param song - the song object
	//  * @param cb
	//  */
	// add: isAdminRequired(async function add(session, song, cb) {
	// 	const SongModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);
	// 	async.waterfall(
	// 		[
	// 			next => {
	// 				SongModel.findOne({ songId: song.songId }, next);
	// 			},

	// 			(existingSong, next) => {
	// 				if (existingSong) return next("Song is already in rotation.");
	// 				return next();
	// 			},

	// 			next => {
	// 				const newSong = new SongModel(song);
	// 				newSong.acceptedBy = session.userId;
	// 				newSong.acceptedAt = Date.now();
	// 				newSong.save(next);
	// 			},

	// 			(res, next) => {
	// 				this.module
	// 					.runJob(
	// 						"RUN_ACTION2",
	// 						{
	// 							session,
	// 							namespace: "queueSongs",
	// 							action: "remove",
	// 							args: [song._id]
	// 						},
	// 						this
	// 					)
	// 					.finally(() => {
	// 						song.genres.forEach(genre => {
	// 							PlaylistsModule.runJob("AUTOFILL_GENRE_PLAYLIST", { genre })
	// 								.then(() => {})
	// 								.catch(() => {});
	// 						});

	// 						next();
	// 					});
	// 			}
	// 		],
	// 		async err => {
	// 			if (err) {
	// 				err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);

	// 				this.log("ERROR", "SONGS_ADD", `User "${session.userId}" failed to add song. "${err}"`);

	// 				return cb({ status: "failure", message: err });
	// 			}

	// 			this.log("SUCCESS", "SONGS_ADD", `User "${session.userId}" successfully added song "${song.songId}".`);

	// 			CacheModule.runJob("PUB", {
	// 				channel: "song.added",
	// 				value: song.songId
	// 			});

	// 			return cb({
	// 				status: "success",
	// 				message: "Song has been moved from the queue successfully."
	// 			});
	// 		}
	// 	);
	// 	// TODO Check if video is in queue and Add the song to the appropriate stations
	// }),

	/**
	 * Likes a song
	 *
	 * @param session
	 * @param musareSongId - the song id
	 * @param cb
	 */
	like: isLoginRequired(async function like(session, musareSongId, cb) {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" }, this);
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);

		async.waterfall(
			[
				next => songModel.findOne({ songId: musareSongId }, next),

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				},

				(song, next) => userModel.findOne({ _id: session.userId }, (err, user) => next(err, song, user)),

				(song, user, next) => {
					if (!user) return next("User does not exist.");

					return this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "addSongToPlaylist",
								args: [false, musareSongId, user.likedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to add song to the 'Liked Songs' playlist.");
							return next(null, song, user.dislikedSongsPlaylist);
						})
						.catch(err => next(err));
				},

				(song, dislikedSongsPlaylist, next) => {
					this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "removeSongFromPlaylist",
								args: [musareSongId, dislikedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to remove song from the 'Disliked Songs' playlist.");
							return next(null, song);
						})
						.catch(err => next(err));
				},

				(song, next) => {
					SongsModule.runJob("RECALCULATE_SONG_RATINGS", { songId: song._id, musareSongId })
						.then(ratings => next(null, song, ratings))
						.catch(err => next(err));
				}
			],
			async (err, song, { likes, dislikes }) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"SONGS_LIKE",
						`User "${session.userId}" failed to like song ${musareSongId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}

				SongsModule.runJob("UPDATE_SONG", { songId: song._id });

				CacheModule.runJob("PUB", {
					channel: "song.like",
					value: JSON.stringify({
						songId: musareSongId,
						userId: session.userId,
						likes,
						dislikes
					})
				});

				ActivitiesModule.runJob("ADD_ACTIVITY", {
					userId: session.userId,
					type: "song__like",
					payload: {
						message: `Liked song <songId>${song.title} by ${song.artists.join(", ")}</songId>`,
						songId: song._id,
						thumbnail: song.thumbnail
					}
				});

				return cb({
					status: "success",
					message: "You have successfully liked this song."
				});
			}
		);
	}),

	// TODO: ALready liked/disliked etc.

	/**
	 * Dislikes a song
	 *
	 * @param session
	 * @param musareSongId - the song id
	 * @param cb
	 */
	dislike: isLoginRequired(async function dislike(session, musareSongId, cb) {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" }, this);
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);

		async.waterfall(
			[
				next => {
					songModel.findOne({ songId: musareSongId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				},

				(song, next) => userModel.findOne({ _id: session.userId }, (err, user) => next(err, song, user)),

				(song, user, next) => {
					if (!user) return next("User does not exist.");

					return this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "addSongToPlaylist",
								args: [false, musareSongId, user.dislikedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to add song to the 'Disliked Songs' playlist.");
							return next(null, song, user.likedSongsPlaylist);
						})
						.catch(err => next(err));
				},

				(song, likedSongsPlaylist, next) => {
					this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "removeSongFromPlaylist",
								args: [musareSongId, likedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to remove song from the 'Liked Songs' playlist.");
							return next(null, song);
						})
						.catch(err => next(err));
				},

				(song, next) => {
					SongsModule.runJob("RECALCULATE_SONG_RATINGS", { songId: song._id, musareSongId })
						.then(ratings => next(null, song, ratings))
						.catch(err => next(err));
				}
			],
			async (err, song, { likes, dislikes }) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"SONGS_DISLIKE",
						`User "${session.userId}" failed to dislike song ${musareSongId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}

				SongsModule.runJob("UPDATE_SONG", { songId: song._id });

				CacheModule.runJob("PUB", {
					channel: "song.dislike",
					value: JSON.stringify({
						songId: musareSongId,
						userId: session.userId,
						likes,
						dislikes
					})
				});

				ActivitiesModule.runJob("ADD_ACTIVITY", {
					userId: session.userId,
					type: "song__dislike",
					payload: {
						message: `Disliked song <songId>${song.title} by ${song.artists.join(", ")}</songId>`,
						songId: song._id,
						thumbnail: song.thumbnail
					}
				});

				return cb({
					status: "success",
					message: "You have successfully disliked this song."
				});
			}
		);
	}),

	/**
	 * Undislikes a song
	 *
	 * @param session
	 * @param musareSongId - the song id
	 * @param cb
	 */
	undislike: isLoginRequired(async function undislike(session, musareSongId, cb) {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" }, this);
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);

		async.waterfall(
			[
				next => {
					songModel.findOne({ songId: musareSongId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				},

				(song, next) => userModel.findOne({ _id: session.userId }, (err, user) => next(err, song, user)),

				(song, user, next) => {
					if (!user) return next("User does not exist.");

					return this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "removeSongFromPlaylist",
								args: [musareSongId, user.dislikedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to remove song from the 'Disliked Songs' playlist.");
							return next(null, song, user.likedSongsPlaylist);
						})
						.catch(err => next(err));
				},

				(song, likedSongsPlaylist, next) => {
					this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "removeSongFromPlaylist",
								args: [musareSongId, likedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to remove song from the 'Liked Songs' playlist.");
							return next(null, song);
						})
						.catch(err => next(err));
				},

				(song, next) => {
					SongsModule.runJob("RECALCULATE_SONG_RATINGS", { songId: song._id, musareSongId })
						.then(ratings => next(null, song, ratings))
						.catch(err => next(err));
				}
			],
			async (err, song, { likes, dislikes }) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"SONGS_UNDISLIKE",
						`User "${session.userId}" failed to undislike song ${musareSongId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}

				SongsModule.runJob("UPDATE_SONG", { songId: song._id });

				CacheModule.runJob("PUB", {
					channel: "song.undislike",
					value: JSON.stringify({
						songId: musareSongId,
						userId: session.userId,
						likes,
						dislikes
					})
				});

				ActivitiesModule.runJob("ADD_ACTIVITY", {
					userId: session.userId,
					type: "song__undislike",
					payload: {
						message: `Removed <songId>${song.title} by ${song.artists.join(
							", "
						)}</songId> from your Disliked Songs`,
						songId: song._id,
						thumbnail: song.thumbnail
					}
				});

				return cb({
					status: "success",
					message: "You have successfully undisliked this song."
				});
			}
		);
	}),

	/**
	 * Unlikes a song
	 *
	 * @param session
	 * @param musareSongId - the song id
	 * @param cb
	 */
	unlike: isLoginRequired(async function unlike(session, musareSongId, cb) {
		const userModel = await DBModule.runJob("GET_MODEL", { modelName: "user" }, this);
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);

		async.waterfall(
			[
				next => {
					songModel.findOne({ songId: musareSongId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null, song);
				},

				(song, next) => userModel.findOne({ _id: session.userId }, (err, user) => next(err, song, user)),

				(song, user, next) => {
					if (!user) return next("User does not exist.");

					return this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "removeSongFromPlaylist",
								args: [musareSongId, user.dislikedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to remove song from the 'Disliked Songs' playlist.");
							return next(null, song, user.likedSongsPlaylist);
						})
						.catch(err => next(err));
				},

				(song, likedSongsPlaylist, next) => {
					this.module
						.runJob(
							"RUN_ACTION2",
							{
								session,
								namespace: "playlists",
								action: "removeSongFromPlaylist",
								args: [musareSongId, likedSongsPlaylist]
							},
							this
						)
						.then(res => {
							if (res.status === "failure")
								return next("Unable to remove song from the 'Liked Songs' playlist.");
							return next(null, song);
						})
						.catch(err => next(err));
				},

				(song, next) => {
					SongsModule.runJob("RECALCULATE_SONG_RATINGS", { songId: song._id, musareSongId })
						.then(ratings => next(null, song, ratings))
						.catch(err => next(err));
				}
			],
			async (err, song, { likes, dislikes }) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"SONGS_UNLIKE",
						`User "${session.userId}" failed to unlike song ${musareSongId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}

				SongsModule.runJob("UPDATE_SONG", { songId: song._id });

				CacheModule.runJob("PUB", {
					channel: "song.unlike",
					value: JSON.stringify({
						songId: musareSongId,
						userId: session.userId,
						likes,
						dislikes
					})
				});

				ActivitiesModule.runJob("ADD_ACTIVITY", {
					userId: session.userId,
					type: "song__unlike",
					payload: {
						message: `Removed <songId>${song.title} by ${song.artists.join(
							", "
						)}</songId> from your Liked Songs`,
						songId: song._id,
						thumbnail: song.thumbnail
					}
				});

				return cb({
					status: "success",
					message: "You have successfully unliked this song."
				});
			}
		);
	}),

	/**
	 * Gets user's own song ratings
	 *
	 * @param session
	 * @param musareSongId - the song id
	 * @param cb
	 */

	getOwnSongRatings: isLoginRequired(async function getOwnSongRatings(session, musareSongId, cb) {
		const playlistModel = await DBModule.runJob("GET_MODEL", { modelName: "playlist" }, this);
		const songModel = await DBModule.runJob("GET_MODEL", { modelName: "song" }, this);

		async.waterfall(
			[
				next => {
					songModel.findOne({ songId: musareSongId }, next);
				},

				(song, next) => {
					if (!song) return next("No song found with that id.");
					return next(null);
				},

				next =>
					playlistModel.findOne(
						{ createdBy: session.userId, displayName: "Liked Songs" },
						(err, playlist) => {
							if (err) return next(err);
							if (!playlist) return next("'Liked Songs' playlist does not exist.");

							let isLiked = false;

							Object.values(playlist.songs).forEach(song => {
								// song is found in 'liked songs' playlist
								if (song.songId === musareSongId) isLiked = true;
							});

							return next(null, isLiked);
						}
					),

				(isLiked, next) =>
					playlistModel.findOne(
						{ createdBy: session.userId, displayName: "Disliked Songs" },
						(err, playlist) => {
							if (err) return next(err);
							if (!playlist) return next("'Disliked Songs' playlist does not exist.");

							const ratings = { isLiked, isDisliked: false };

							Object.values(playlist.songs).forEach(song => {
								// song is found in 'disliked songs' playlist
								if (song.songId === musareSongId) ratings.isDisliked = true;
							});

							return next(null, ratings);
						}
					)
			],
			async (err, ratings) => {
				if (err) {
					err = await UtilsModule.runJob("GET_ERROR", { error: err }, this);
					this.log(
						"ERROR",
						"SONGS_GET_OWN_RATINGS",
						`User "${session.userId}" failed to get ratings for ${musareSongId}. "${err}"`
					);
					return cb({ status: "failure", message: err });
				}

				const { isLiked, isDisliked } = ratings;

				return cb({
					status: "success",
					songId: musareSongId,
					liked: isLiked,
					disliked: isDisliked
				});
			}
		);
	})
};
