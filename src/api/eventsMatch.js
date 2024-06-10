class Events {
	async generation(events, teams, score) {
		try {
			const blockEvent = this.getBlockEvent(events);
			const eventName = blockEvent.name;
			const eventText = this.getTextEvent(blockEvent.list)

			const statusTeam = this.getTeamForEvent(teams);
			const team = teams[statusTeam];
			const nameTeam = team.name;

			const player = this.getPlayerForEvent(team.firstTeam)

			const dataEvent = {
				text: eventText,
				replace: {
					team: nameTeam,
					player
				}
			}

			let newPlayer;
			if(eventName === 'reverse') {
				newPlayer = this.getPlayerForEvent(team.substitute);
				dataEvent.replace.newPlayer = newPlayer;
			}

			if(eventName === 'goal') {
				score[statusTeam] += 1; 
				dataEvent.replace.score = `${score.home} – ${score.guest}`;
			}

			const text = this.getCurrectText(dataEvent);
		
			const event = {
				name: eventName,
				text,
				options: {
					team: statusTeam,
					player
				}
			}
			if(eventName === 'reverse') {
				event.options.newPlayer = newPlayer;
			}

			if(eventName === 'goal') {
				event.options.score = score;
			}

			return event;
		} catch (err) {
			return false;
		}
	}

	getRandomNumber(min, max) {
		const randNumb = (Math.random() * (Number(max) - Number(min) + 1)) + Number(min);
		const currectNumb = Math.floor(randNumb);

		return currectNumb;
	}

	getBlockEvent(events) {
		const [ min, max ] = events.interval;
		const number = this.getRandomNumber(min, max);
		const event = this.getBlockEventByNumber(number, events.list);

		return event;
	}
	
	getBlockEventByNumber(number, events) {
		for(let event of events) {
			if(number >= Number(event.interval[0]) && number <= Number(event.interval[1])) {
				return event;
			}
		}
	}
	
	getTextEvent(list) {
		const min = 0;
		const max = list.length - 1;

		const number = this.getRandomNumber(min, max);
		const eventText = list[number];

		return eventText;
	}

	getTeamForEvent(teams) {
		const keysTeams = Object.keys(teams);
		const min = 0;
		const max = keysTeams.length - 1;
		const number = this.getRandomNumber(min, max);

		const team = keysTeams[number];
		
		return team;
	}

	getPlayerForEvent(players) {
		const min = 0;
		const max = players.length - 1;
		const number = this.getRandomNumber(min, max);
		const player = players[number];
		return player;
	}

	getCurrectText(data) {
		let text = data.text;
		const replace = data.replace;

		for(let key in replace) {
			text = this.replaceText(text, key, replace[key])
		}

		return text;
	}

	replaceText(text, key, newWord) {
		const newText = text.replaceAll(`{${key}}`, newWord);
		return newText;
	}
}


module.exports = {
	Events
}