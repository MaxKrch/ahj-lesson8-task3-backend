const fs = require('fs/promises');
const path = require('path');

class State {
	constructor() {
		this.teamsFile = path.resolve(__dirname, '../data/teams.json');
		this.eventsFile = path.resolve(__dirname, '../data/events.json');
		this.watchFile = path.resolve(__dirname, '../data/watch.json');

		this.teams = {
			loaded: false,
			list: {
				home: {
				},
				guest: {
				}
			}
		}	
		this.events = {
			loaded: false,
			interval: [
				1,
				100,
			],
			time: {
				min: 5000,
				max: 25000,
			},
			list: [
			],
			watch: {
				loaded: false,
				list: { 
				}
			}
		}
		this.match = {
			score: {
				home: 0,
				guest: 0,
				},
			fouls: {
				home: [],
				guest: [],
			},
			goals: {
				home: [],
				guest: [],
			},
			reverse: {
				home: [],
				guest: [],
			},
			parts: [
				{
					name: 'First Half', 
					duration: 600000
				},
				{
					name: 'Half-time', 
					duration: 60000
				},
				{
					name:	'Second Half',
					duration: 600000
				}
			],
			live: {
				game: false,
				timer: null,
			},
			service: {
				restart: null,
				rematch: {
					timer: null,
					time: 600000
				},
				start: 6000,
				events: {
					timer: null,
				}
			}
		}

		this.loadState();		
	}

	async loadState() {
		try {
			await this.setTeams();
			await this.setEvents();
			await this.setWatch();
		} catch(err) {
			console.log(`Что-то пошло не так ${err}`)
		}
	}

	async setTeams() {
		try {
			const data = await fs.readFile(this.teamsFile, 'utf8');
			if(!data) {
				return;
			}
			const teams = JSON.parse(data);
			const home = teams.home; 
			const	guest = teams.guest;

			for(let key in home) {
				this.teams.list.home[key] = home[key];
			}
			for(let key in guest) {
				this.teams.list.guest[key] = guest[key];
			}

			this.teams.loaded = true;
		} catch {
			return false;
		}
	}

	async setEvents() {
		try {
			const data = await fs.readFile(this.eventsFile, 'utf8');
			if(!data) {
				return;
			}
			const events = JSON.parse(data);

			for(let key in events) {
				this.events.list[key] = events[key]
			}

			this.events.loaded = true;	
		} catch {
			return false;
		}
	}

	async setWatch() {
		try {
			const data = await fs.readFile(this.watchFile, 'utf8');
			const watch = JSON.parse(data)
		
			this.events.watch.list = watch;
			this.events.watch.loaded = true;
		} catch {
			return false;
		}
	}

	getScore() {
		const score = {
			home: this.match.score.home,
			guest: this.match.score.guest,
		}
		return score;
	}

	getTeams() {
		if(!this.teams.loaded) {
			return false;
		}
		const teams = {
			home: this.teams.list.home.name,
			guest: this.teams.list.guest.name,
		}
		return teams;
	}

	addGoal(team) {
		const newScore = this.getScore();
		return newScore;
	}

	addFoul(team, player) {

	}

	reversePlayer(team, oldPlayer, newPlayer) {

	}
}

module.exports = {
	State
}