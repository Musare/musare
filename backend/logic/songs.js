import async from "async";
import mongoose from "mongoose";
import CoreClass from "../core";

let SongsModule;
let CacheModule;
let DBModule;
let UtilsModule;
let YouTubeModule;
let StationModule;
let PlaylistModule;

class _SongsModule extends CoreClass {
	// eslint-disable-next-line require-jsdoc
	constructor() {
		super("songs");

		SongsModule = this;
	}

	/**
	 * Initialises the songs module
	 *
	 * @returns {Promise} - returns promise (reject, resolve)
	 */
	async initialize() {
		this.setStage(1);

		CacheModule = this.moduleManager.modules.cache;
		DBModule = this.moduleManager.modules.db;
		UtilsModule = this.moduleManager.modules.utils;
		YouTubeModule = this.moduleManager.modules.youtube;
		StationModule = this.moduleManager.modules.stations;
		PlaylistModule = this.moduleManager.modules.playlists;

		this.SongModel = await DBModule.runJob("GET_MODEL", { modelName: "song" });
		this.SongSchemaCache = await CacheModule.runJob("GET_SCHEMA", { schemaName: "song" });

		this.setStage(2);

		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						this.setStage(2);
						CacheModule.runJob("HGETALL", { table: "songs" })
							.then(songs => {
								next(null, songs);
							})
							.catch(next);
					},

					(songs, next) => {
						this.setStage(3);

						if (!songs) return next();

						const songIds = Object.keys(songs);

						return async.each(
							songIds,
							(songId, next) => {
								SongsModule.SongModel.findOne({ songId }, (err, song) => {
									if (err) next(err);
									else if (!song)
										CacheModule.runJob("HDEL", {
											table: "songs",
											key: songId
										})
											.then(() => next())
											.catch(next);
									else next();
								});
							},
							next
						);
					},

					next => {
						this.setStage(4);
						SongsModule.SongModel.find({}, next);
					},

					(songs, next) => {
						this.setStage(5);
						async.each(
							songs,
							(song, next) => {
								CacheModule.runJob("HSET", {
									table: "songs",
									key: song.songId,
									value: SongsModule.SongSchemaCache(song)
								})
									.then(() => next())
									.catch(next);
							},
							next
						);
					}
				],
				async err => {
					if (err) {
						err = await UtilsModule.runJob("GET_ERROR", { error: err });
						reject(new Error(err));
					} else resolve();
				}
			)
		);
	}

	/**
	 * Gets a song by id from the cache or Mongo, and if it isn't in the cache yet, adds it the cache
	 *
	 * @param {object} payload - object containing the payload
	 * @param {string} payload.id - the id of the song we are trying to get
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	GET_SONG(payload) {
		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						if (!mongoose.Types.ObjectId.isValid(payload.id)) return next("Id is not a valid ObjectId.");
						return CacheModule.runJob("HGET", { table: "songs", key: payload.id }, this)
							.then(song => next(null, song))
							.catch(next);
					},

					(song, next) => {
						if (song) return next(true, song);
						return SongsModule.SongModel.findOne({ _id: payload.id }, next);
					},

					(song, next) => {
						if (song) {
							CacheModule.runJob(
								"HSET",
								{
									table: "songs",
									key: payload.id,
									value: song
								},
								this
							).then(song => next(null, song));
						} else next("Song not found.");
					}
				],
				(err, song) => {
					if (err && err !== true) return reject(new Error(err));
					return resolve({ song });
				}
			)
		);
	}

	/**
	 * Makes sure that if a song is not currently in the songs db, to add it
	 *
	 * @param {object} payload - an object containing the payload
	 * @param {string} payload.songId - the youtube song id of the song we are trying to ensure is in the songs db
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	ENSURE_SONG_EXISTS_BY_SONG_ID(payload) {
		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						SongsModule.SongModel.findOne({ songId: payload.songId }, next);
					},

					(song, next) => {
						if (song) next(true, song);
						else {
							YouTubeModule.runJob("GET_SONG", { songId: payload.songId }, this)
								.then(response => next(null, { ...response.song }))
								.catch(next);
						}
					},

					(_song, next) => {
						const song = new SongsModule.SongModel({ ..._song });
						song.save({ validateBeforeSave: true }, err => {
							if (err) return next(err, song);
							return next(null, song);
						});
					}
				],
				(err, song) => {
					if (err && err !== true) return reject(new Error(err));
					return resolve({ song });
				}
			)
		);
	}

	/**
	 * Gets a song by song id from the cache or Mongo, and if it isn't in the cache yet, adds it the cache
	 *
	 * @param {object} payload - an object containing the payload
	 * @param {string} payload.songId - the mongo id of the song we are trying to get
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	GET_SONG_FROM_ID(payload) {
		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						SongsModule.SongModel.findOne({ songId: payload.songId }, next);
					}
				],
				(err, song) => {
					if (err && err !== true) return reject(new Error(err));
					return resolve({ song });
				}
			)
		);
	}

	/**
	 * Gets a song from id from Mongo and updates the cache with it
	 *
	 * @param {object} payload - an object containing the payload
	 * @param {string} payload.songId - the id of the song we are trying to update
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	UPDATE_SONG(payload) {
		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						SongsModule.SongModel.findOne({ _id: payload.songId }, next);
					},

					(song, next) => {
						if (!song) {
							CacheModule.runJob("HDEL", {
								table: "songs",
								key: payload.songId
							});
							return next("Song not found.");
						}

						return CacheModule.runJob(
							"HSET",
							{
								table: "songs",
								key: payload.songId,
								value: song
							},
							this
						)
							.then(song => {
								next(null, song);
							})
							.catch(next);
					},

					(song, next) => {
						next(null, song);
						const { _id, songId, title, artists, thumbnail, duration, verified } = song;
						const trimmedSong = {
							_id,
							songId,
							title,
							artists,
							thumbnail,
							duration,
							verified
						};
						this.log("INFO", `Going to update playlists and stations now for song ${_id}`);
						DBModule.runJob("GET_MODEL", { modelName: "playlist" }).then(playlistModel => {
							playlistModel.updateMany(
								{ "songs._id": song._id },
								{ $set: { "songs.$": trimmedSong } },
								err => {
									if (err) this.log("ERROR", err);
									else
										playlistModel.find({ "songs._id": song._id }, (err, playlists) => {
											playlists.forEach(playlist => {
												PlaylistModule.runJob("UPDATE_PLAYLIST", {
													playlistId: playlist._id
												});
											});
										});
								}
							);
						});
						DBModule.runJob("GET_MODEL", { modelName: "station" }).then(stationModel => {
							stationModel.updateMany(
								{ "queue._id": song._id },
								{
									$set: {
										"queue.$.songId": songId,
										"queue.$.title": title,
										"queue.$.artists": artists,
										"queue.$.thumbnail": thumbnail,
										"queue.$.duration": duration,
										"queue.$.verified": verified
									}
								},
								err => {
									if (err) this.log("ERROR", err);
									else
										stationModel.find({ "queue._id": song._id }, (err, stations) => {
											stations.forEach(station => {
												StationModule.runJob("UPDATE_STATION", { stationId: station._id });
											});
										});
								}
							);
						});
					}
				],
				(err, song) => {
					if (err && err !== true) return reject(new Error(err));
					return resolve(song);
				}
			)
		);
	}

	/**
	 * Deletes song from id from Mongo and cache
	 *
	 * @param {object} payload - returns an object containing the payload
	 * @param {string} payload.songId - the id of the song we are trying to delete
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	DELETE_SONG(payload) {
		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						SongsModule.SongModel.deleteOne({ songId: payload.songId }, next);
					},

					next => {
						CacheModule.runJob(
							"HDEL",
							{
								table: "songs",
								key: payload.songId
							},
							this
						)
							.then(() => next())
							.catch(next);
					}
				],
				err => {
					if (err && err !== true) return reject(new Error(err));
					return resolve();
				}
			)
		);
	}

	/**
	 * Recalculates dislikes and likes for a song
	 *
	 * @param {object} payload - returns an object containing the payload
	 * @param {string} payload.musareSongId - the (musare) id of the song
	 * @param {string} payload.songId - the (mongodb) id of the song
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	async RECALCULATE_SONG_RATINGS(payload) {
		const playlistModel = await DBModule.runJob("GET_MODEL", { modelName: "playlist" }, this);

		return new Promise((resolve, reject) => {
			async.waterfall(
				[
					next => {
						playlistModel.countDocuments(
							{ songs: { $elemMatch: { songId: payload.musareSongId } }, displayName: "Liked Songs" },
							(err, likes) => {
								if (err) return next(err);
								return next(null, likes);
							}
						);
					},

					(likes, next) => {
						playlistModel.countDocuments(
							{ songs: { $elemMatch: { songId: payload.musareSongId } }, displayName: "Disliked Songs" },
							(err, dislikes) => {
								if (err) return next(err);
								return next(err, { likes, dislikes });
							}
						);
					},

					({ likes, dislikes }, next) => {
						SongsModule.SongModel.updateOne(
							{ _id: payload.songId },
							{
								$set: {
									likes,
									dislikes
								}
							},
							err => next(err, { likes, dislikes })
						);
					}
				],
				(err, { likes, dislikes }) => {
					if (err) return reject(new Error(err));
					return resolve({ likes, dislikes });
				}
			);
		});
	}

	/**
	 * Gets an array of all genres
	 *
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	GET_ALL_GENRES() {
		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						SongsModule.SongModel.find({ verified: true }, { genres: 1, _id: false }, next);
					},

					(songs, next) => {
						let allGenres = [];
						songs.forEach(song => {
							allGenres = allGenres.concat(song.genres);
						});

						const lowerCaseGenres = allGenres.map(genre => genre.toLowerCase());
						const uniqueGenres = lowerCaseGenres.filter(
							(value, index, self) => self.indexOf(value) === index
						);

						next(null, uniqueGenres);
					}
				],
				(err, genres) => {
					if (err && err !== true) return reject(new Error(err));
					return resolve({ genres });
				}
			)
		);
	}

	/**
	 * Gets an array of all songs with a specific genre
	 *
	 * @param {object} payload - returns an object containing the payload
	 * @param {string} payload.genre - the genre
	 * @returns {Promise} - returns a promise (resolve, reject)
	 */
	GET_ALL_SONGS_WITH_GENRE(payload) {
		return new Promise((resolve, reject) =>
			async.waterfall(
				[
					next => {
						SongsModule.SongModel.find(
							{ verified: true, genres: { $regex: new RegExp(`^${payload.genre.toLowerCase()}$`, "i") } },
							next
						);
					}
				],
				(err, songs) => {
					if (err && err !== true) return reject(new Error(err));
					return resolve({ songs });
				}
			)
		);
	}
}

export default new _SongsModule();
