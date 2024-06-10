const fs = require('fs/promises');
const path = require('path');

class Record {
	constructor() {
		this.matchFile = path.resolve(__dirname, '../data/match.json'); 
	}

	async loadEvents () {
		try{
			const match = await fs.readFile(this.matchFile);
			const events = JSON.parse(match);

			return events;
		} catch(err) {
			return false;
		}
	}

	async saveEvent(event) {
		try{
			const data = await fs.readFile(this.matchFile, 'utf8');
			const newEvents = [];

			if(data) {
				const events = JSON.parse(data);
				newEvents.push(...events);;
			}
			newEvents.push(event);
			const newEventsJSON = JSON.stringify(newEvents);
			await fs.writeFile(this.matchFile, newEventsJSON)
		} catch (err) {
			console.log(`Что-то пошло не так ${err}`)
		}
	}
}

module.exports = {
	Record
}