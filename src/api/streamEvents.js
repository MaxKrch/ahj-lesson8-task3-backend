const { streamEvents } = require('http-event-stream');

const clients = [];

const streamMatch = (ctx) => {
	streamEvents(ctx.req, ctx.res, {
		async fetch(lastEventId) {
			return [] 
		},

		stream(sse) {
			clients.push(sse)

			return (sse) => {
				const index = clients.indexOf(sse);
				if(index >= 0) {
					clients.splice(index, 1);
				}
			}
		}
	})

	ctx.respond = false;
}

module.exports = {
	streamMatch,
	clients
}