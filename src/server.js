const Koa = require('koa');
const cors = require('@koa/cors');
const { koaBody } = require('koa-body');
const Router = require('koa-router');

const { App } = require('./api/engineApp.js');
const app = new App;

const { streamMatch } = require('./api/streamEvents.js');

const koa = new Koa();
const router = new Router();

koa.use(cors())
  .use(koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
  }));

router.get('/sse', async (ctx, next) => {
  streamMatch(ctx);
});

router.get('/history', async (ctx, next) => {
  const mess = await app.loadRecordMatch(); 
  ctx.response.body = mess;
});

router.get('/title', async (ctx, next) => {
  const mess = await app.loadTitleMatch();
  ctx.response.body = mess;
})

koa.use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 7070;

koa.listen(port);
