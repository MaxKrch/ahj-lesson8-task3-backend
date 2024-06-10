const uuid = require('uuid');
const fs = require('fs');
const path = require('path');
const { State } = require('./stateMatch.js');
const { clients } = require('./streamEvents.js');
const { Record } = require('./recordMatch.js');
const { Events } = require('./eventsMatch.js');

class App {
	constructor() {
		this.state = new State();
		this.record = new Record();
		this.events = new Events();
		this.users = clients;
		this.matchFile = path.resolve(__dirname, '../data/match.json');
		this.prestartMatch();
	}

	async loadTitleMatch() {
		const title = {
			success: false,
		}
		const teams = this.state.getTeams();
		const score = this.state.getScore();

		if(teams && score) {
			title.teams = teams;
			title.score = score;
			title.success = true;
		}
		const mess = JSON.stringify(title);
		return mess;
	} 

	async loadRecordMatch() {
		const record = await this.record.loadEvents();
		const mess = record || [];

		return mess;
	}

	async prestartMatch() {
		if(!this.state.events.loaded || !this.state.events.watch.loaded) {
			const restart = () => this.prestartMatch();
		
			restart.bind(this);
			this.state.match.service.restart = setTimeout(restart, 1000);
			
			return;
		}

		if(this.state.match.service.restart) {
			clearTimeout(this.state.match.service.restart);
			this.state.match.service.restart = null;
		}

		if(this.state.match.service.rematch.timer) {
			clearTimeout(this.state.match.service.rematch.timer);
			this.state.match.service.rematch.timer = null;
		}

		this.state.match.score.home = 0;
		this.state.match.score.guest = 0;

		const emptyMatch = JSON.stringify([])
		fs.writeFileSync(this.matchFile, emptyMatch);
		
		console.log(new Date());
		const startFirstHalf = () => this.startMatch()		

		const start = this.state.match.service.start
		startFirstHalf.bind(this);
		this.state.match.live.timer = setTimeout(startFirstHalf, start);
	}

	startMatch() {
		this.startGenerationEvents();

		console.log(new Date());
		this.state.match.live.game = true;
		
		const text = this.state.events.watch.list[0].text;
		const options = { 
			match: this.state.events.watch.list[0].match,
		}
		const newEvent = this.createEvent('watch', text, options);

		this.sendEvent(newEvent);
		this.record.saveEvent(newEvent);
			
		const start = this.state.match.parts[0].duration;
		const startHalfTime = () => this.endFirstHalf();

		startHalfTime.bind(this);
		this.state.match.live.timer = setTimeout(startHalfTime, start)
	}

	endFirstHalf() {
		console.log(new Date());
		this.state.match.live.game = false;
		
		const text = this.state.events.watch.list[1].text;
		const options = { 
			match: this.state.events.watch.list[1].match,
		}
		const newEvent = this.createEvent('watch', text, options);
	
		this.sendEvent(newEvent);
		this.record.saveEvent(newEvent);

		const start = this.state.match.parts[1].duration;
		const startSecondHalf = () => this.endHalfTime();

		startSecondHalf.bind(this);
		this.state.match.live.timer = setTimeout(startSecondHalf, start);
	}
	
	endHalfTime() {
		console.log(new Date());
		this.state.match.live.game = true;

		const text = this.state.events.watch.list[2].text;
		const options = { 
			match: this.state.events.watch.list[2].match,
		}
		const newEvent = this.createEvent('watch', text, options);

		this.sendEvent(newEvent);
		this.record.saveEvent(newEvent);

		const start = this.state.match.parts[2].duration;
		const finishMatch = () => this.endMatch();

		finishMatch.bind(this);
		this.state.match.live.timer = setTimeout(finishMatch, start);
	}

	endMatch() {
		console.log(new Date())
		this.state.match.live.game = false;

		const text = this.state.events.watch.list[3].text;
		const options = { 
			match: this.state.events.watch.list[3].match,
		}
		const lastEvent = this.createEvent('watch', text, options);

		this.sendEvent(lastEvent);
		this.record.saveEvent(lastEvent);

		this.state.match.live.timer = null;

		const newMatch = () => this.prestartMatch();
		
		newMatch.bind(this);
		const start = this.state.match.service.rematch.time;
		// this.state.match.service.rematch.timer = setTimeout(newMatch, start);
	}


	startGenerationEvents() {
		const start = this.timerNextEvent();
		const genFirstEvent = () => this.generationEvent();

		this.state.match.service.events.timer = setTimeout(genFirstEvent, start)
	}	

	timerNextEvent() {
		const { min, max } = this.state.events.time;
		const time = this.events.getRandomNumber(min, max)
		
		return time;
	}

	async generationEvent() {
		if(!this.state.match.live.timer) {
			this.state.match.service.events.timer = null;
			return;
		}

		if(!this.state.match.live.game) { 
			const restartGenEvents = () => this.generationEvent();
			const timeRestart = this.state.match.parts[1].duration; 
			this.state.match.service.events.timer = setTimeout(restartGenEvents, timeRestart);
			return;
		}

		const eventData = await this.events.generation(this.state.events, this.state.teams.list, this.state.match.score);

		if(eventData) {
			const { name, text, options = {} } = eventData;
			const newEvent = this.createEvent(name, text, options);
			
			if(name === 'goal') {
				this.addGoalToState(newEvent) 
			}

			if(name === 'foul') {
				this.addFoulToState(newEvent) 
			} 

			if(name === 'reverse') {
				this.addReverseToState(newEvent)
			}

			this.sendEvent(newEvent);
			this.record.saveEvent(newEvent);
		}

		const startNextGen = this.timerNextEvent();
		const nextGenEvent = () => this.generationEvent();

		nextGenEvent.bind(this);
		this.state.match.service.events.timer = setTimeout(nextGenEvent, startNextGen);
	}

	sendEvent(event) {
		const eventJSON = JSON.stringify(event);	
		const id = uuid.v4();

		for(let user of this.users) {
	
			user.sendEvent({
				data: eventJSON,
				id,
			})
		}
	}

	createEvent(name, text, options) {
		const time = new Date();
		const event = {
			name,
			text,
			time
		}

		if(options) {
			event.options = options;
		}
		return event;
	}

	addGoalToState(event) {	
		const { time, options: { team, player } } = event;
		const newGoal = {
			player,
			time
		}

		const stateTeam = this.state.match.goals[team];
		stateTeam.push(newGoal);
	}
	
	addFoulToState(event) {
		const { time, options: { team, player } } = event;
		const newFoul = {
			player,
			time
		}
		const stateTeam = this.state.match.fouls[team];
		stateTeam.push(newFoul);
	}

	addReverseToState(event) {
		const { time, options: { team, player, newPlayer } } = event;
		const newReverse = {
			substituted: player, 
			newPlayer,
			time
		}
		const stateTeam = this.state.match.reverse[team];

		this.reverse(team, player, newPlayer);
	}

	reverse(team, player, newPlayer) {
		const activeTeam = this.state.teams.list[team];
		
		const substPlayerIndex = activeTeam.firstTeam.indexOf(player);
		const substPlayer = activeTeam.firstTeam.splice(substPlayerIndex, 1);
		
		activeTeam.substitute.push(substPlayer[0]);

		const newFirstPlayerIndex = activeTeam.substitute.indexOf(newPlayer);
		const newFirstPlayer = activeTeam.substitute.splice(newFirstPlayerIndex, 1);

		activeTeam.firstTeam.push(newFirstPlayer[0])
	}
}

module.exports = {
	App
}