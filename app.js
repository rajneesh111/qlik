import { Auth, AuthType } from "https://unpkg.com/@qlik/sdk";

const config = {
  authType: AuthType.OAuth2,
  host: "https://qlik.dealopia.com",
  clientId: "1ccd68bdfbd53d5d2847864edbc86ef3",
  redirectUri: window.location.origin,
  scopes: ["user_default"]
};

(async () => {
  const auth = new Auth(config);
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code) {
    await auth.authorize(window.location.href); // exchanges the credentials for a token
    window.history.pushState({}, "", "/");
    await renderPieChart(auth);
  } else if (!(await auth.isAuthorized())) { {
    const { url } = await auth.generateAuthorizationUrl();
    window.location = url;
  }
})();

async function renderPieChart(auth) {

  const script = `
    TempTable:
    Load
    RecNo() as Field1,
    Rand() as Field2,
    Rand() as Field3
    AutoGenerate 5
  `;
  const schema = await (await fetch('https://unpkg.com/enigma.js/schemas/12.936.0.json')).json();
  const randomId = Math.random().toString(32).substring(3);
  const appId = `SessionApp_${randomId}`;
  // websocket url for Enigma.js
  const wsUrl = await auth.generateWebsocketUrl(appId);
  const session = enigma.create({
    schema,
    createSocket: () => new WebSocket(wsUrl),
  });

  // opens the app
  const app = await (await session.open()).getActiveDoc();
  await app.setScript(script);
  await app.doReload();

  // create renderer
  const renderer = window.stardust.embed(app, {
    context: { theme: "light" },
    types: [
      {
        name: 'pie-chart',
        load: () => Promise.resolve(window['sn-pie-chart']),
      }
    ]
  });

  // renders toolbar
  (await renderer.selections()).mount(document.querySelector('.toolbar'));

  // renders a pie chart
  renderer.render({
    type: 'pie-chart',
    element: document.querySelector('#pie'),
    fields: ['Field1', 'Field2', '=Sum(Field3)'],
    properties: {
      title: 'Nebula Pie Chart example',
    },
  });
}





const response = await (await auth.rest('/users/me')).json();
console.log(response);
