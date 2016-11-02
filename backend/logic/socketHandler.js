'use strict';

module.exports = (core, io) => {

	io.on('connection', socket => {
		console.log("User has connected");
		let _user = socket.request.user;

		socket.on('disconnect', () => {
			console.log('User has disconnected');
		});

		socket.on('/stations', cb => {
			core['/stations'](result => {
				cb(result);
			});
		});

		/*socket.on('/station/:id/join', (id, cb) => {
			console.log("JOINED!!!");
			core['/station/:id/join'](id, socket.id, result => {
				console.log("CALLBACK!!!");
				cb(result);
			});
		});*/

		socket.on('/youtube/getVideos/:query', (query, cb) => {
			core['/youtube/getVideos/:query'](query, result => {
				cb(result);
			});
		});

		socket.on('/songs/queue/addSongs/:songs', (songs, cb) => {
			core['/songs/queue/addSongs/:songs'](songs, _user, result => {
				cb(result);
			});
		});

		socket.on('/songs/queue/getSongs', (cb) => {
			core['/songs/queue/getSongs'](_user, result => {
				cb(result);
			});
		});

		socket.on('/songs/queue/updateSong/:id', (id, object, cb) => {
			core['/songs/queue/updateSong/:id'](_user, id, object, result => {
				cb(result);
			});
		});

		/*socket.on('/stations/search/:query', (query, cb) => {
			core['/stations/search/:query'](query, result => {
				cb(result);
			});
		});*/

		// this lets the client socket know that they can start making request
		socket.emit('ready', socket.request.user.logged_in);
	});
};
