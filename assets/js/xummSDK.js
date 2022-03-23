const { XummSdk } = require("xumm-sdk");
const Sdk = new XummSdk(
  "621ce94c-d791-48ec-aa47-eeaf510b8d55",
  "64c3bddb-ede6-41f9-9c60-7f43eca03bc0"
);

const main = async () => {
  const request = {
    TransactionType: "Payment",
    Destination: "rNsbajT8qaLJ5WiPHR92uATzybkcSSA3h4",
    Amount: "500",
  };
  const payload = await Sdk.payload.createAndSubscribe(request, (event) => {
    console.log(event.data);
  });
  console.log(payload);
};

main();
