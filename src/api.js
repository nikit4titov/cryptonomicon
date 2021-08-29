const API_KEY =
  "51f80a32cb1a3afe031b5bf8115354e6bb531da8151b4d5b5684fdf89d058862";

const tickerHandlers = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: ticker,
    PRICE: newPrice,
  } = JSON.parse(e.data);

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickerHandlers.get(ticker) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

export const subscribeToTicker = (ticker, cb) => {
  const handlers = tickerHandlers.get(ticker) ?? [];
  tickerHandlers.set(ticker, [...handlers, cb]);
  subscribeToTickerOnWs(ticker);
};

const subscribeToTickerOnWs = (ticker) => {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`${AGGREGATE_INDEX}~CCCAGG~${ticker}~USD`],
  });
};

export const unsubscribeFromTicker = (ticker) => {
  tickerHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker);
};

const unsubscribeFromTickerOnWs = (ticker) => {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`${AGGREGATE_INDEX}~CCCAGG~${ticker}~USD`],
  });
};

const sendToWebSocket = (message) => {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener("open", () => socket.send(stringifiedMessage), {
    once: true,
  });
};

export const fetchCoins = () =>
  fetch(
    `https://min-api.cryptocompare.com/data/all/coinlist?summary=true&api_key=${API_KEY}`
  )
    .then((res) => res.json())
    .then((data) => Object.values(data.Data));
