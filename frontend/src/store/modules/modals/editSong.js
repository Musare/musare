/* eslint no-param-reassign: 0 */

export default {
	namespaced: true,
	state: {
		video: {
			player: null,
			paused: true,
			playerReady: false,
			autoPlayed: false,
			currentTime: 0,
			playbackRate: 1
		},
		songId: null,
		song: {},
		originalSong: {},
		reports: [],
		tab: "discogs",
		newSong: false
	},
	getters: {},
	actions: {
		showTab: ({ commit }, tab) => commit("showTab", tab),
		editSong: ({ commit }, song) => commit("editSong", song),
		setSong: ({ commit }, song) => commit("setSong", song),
		updateOriginalSong: ({ commit }, song) =>
			commit("updateOriginalSong", song),
		resetSong: ({ commit }, songId) => commit("resetSong", songId),
		stopVideo: ({ commit }) => commit("stopVideo"),
		loadVideoById: ({ commit }, id, skipDuration) =>
			commit("loadVideoById", id, skipDuration),
		pauseVideo: ({ commit }, status) => commit("pauseVideo", status),
		getCurrentTime: ({ commit, state }, fixedVal) =>
			new Promise(resolve => {
				commit("getCurrentTime", fixedVal);
				resolve(state.video.currentTime);
			}),
		updateSongField: ({ commit }, data) => commit("updateSongField", data),
		selectDiscogsInfo: ({ commit }, discogsInfo) =>
			commit("selectDiscogsInfo", discogsInfo),
		updateReports: ({ commit }, reports) =>
			commit("updateReports", reports),
		resolveReport: ({ commit }, reportId) =>
			commit("resolveReport", reportId),
		updateYoutubeId: ({ commit }, youtubeId) => {
			commit("updateYoutubeId", youtubeId);
			commit("loadVideoById", youtubeId, 0);
		},
		setPlaybackRate: ({ commit }, rate) => commit("setPlaybackRate", rate)
	},
	mutations: {
		showTab(state, tab) {
			state.tab = tab;
		},
		editSong(state, song) {
			state.newSong = !!song.newSong;
			state.songId = song.newSong ? null : song.songId;
			state.prefillData = song.prefill ? song.prefill : {};
		},
		setSong(state, song) {
			if (song.discogs === undefined) song.discogs = null;
			state.originalSong = JSON.parse(JSON.stringify(song));
			state.song = { ...song };
		},
		updateOriginalSong(state, song) {
			state.originalSong = JSON.parse(JSON.stringify(song));
		},
		resetSong(state, songId) {
			if (state.songId === songId) state.songId = "";
			if (state.song && state.song._id === songId) state.song = {};
			if (state.originalSong && state.originalSong._id === songId)
				state.originalSong = {};
		},
		stopVideo(state) {
			if (state.video.player && state.video.player.stopVideo)
				state.video.player.stopVideo();
		},
		loadVideoById(state, id, skipDuration) {
			state.song.duration = -1;
			state.video.player.loadVideoById(id, skipDuration);
		},
		pauseVideo(state, status) {
			if (
				(state.video.player && state.video.player.pauseVideo) ||
				state.video.playVideo
			) {
				if (status) state.video.player.pauseVideo();
				else state.video.player.playVideo();
			}
			state.video.paused = status;
		},
		getCurrentTime(state, fixedVal) {
			if (!state.playerReady) state.video.currentTime = 0;
			else {
				Promise.resolve(state.video.player.getCurrentTime()).then(
					time => {
						if (fixedVal)
							Promise.resolve(time.toFixed(fixedVal)).then(
								fixedTime => {
									state.video.currentTime = fixedTime;
								}
							);
						else state.video.currentTime = time;
					}
				);
			}
		},
		updateSongField(state, data) {
			state.song[data.field] = data.value;
		},
		selectDiscogsInfo(state, discogsInfo) {
			state.song.discogs = discogsInfo;
		},
		updateReports(state, reports) {
			state.reports = reports;
		},
		resolveReport(state, reportId) {
			state.reports = state.reports.filter(
				report => report._id !== reportId
			);
		},
		updateYoutubeId(state, youtubeId) {
			state.song.youtubeId = youtubeId;
		},
		setPlaybackRate(state, rate) {
			if (rate) {
				state.video.playbackRate = rate;
				state.video.player.setPlaybackRate(rate);
			} else if (
				state.video.playbackRate !==
				state.video.player.getPlaybackRate()
			) {
				state.video.player.setPlaybackRate(state.video.playbackRate);
				state.video.playbackRate = state.video.player.getPlaybackRate();
			}
		}
	}
};
