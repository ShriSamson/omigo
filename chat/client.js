'use strict';
module.exports = client;

function client(socket) {
  let {id} = socket;
  let partnersMap = {};
  let currentPartner = false;
  let isWaiting = true;

  return {
    id,
    socket,
    setPartnerInfo,
    isValidPartner,
    waitNext,
    sendSystemInfo,
    sendMessageToPartner,
    disconnectFromPartner,
    isWaiting: () => isWaiting
  };

  function setPartnerInfo(partner) {
    let currentTimestamp = Math.floor(Date.now() / 1000);
    if (!partnersMap[partner.id]) partnersMap[partner.id] = {chatsCount:0};
    partnersMap[partner.id].lastChatTimestamp = currentTimestamp;
    partnersMap[partner.id].chatsCount++;
    isWaiting = false;
    partner.sendSystemInfo('partner_connected');
    // console.log(socket.id, 'is the new partner of', partner.id);
    currentPartner = partner;
  }

  function disconnectFromPartner() {
    if (currentPartner) {
      currentPartner.waitNext();
      currentPartner.sendSystemInfo('partner_disconnected');
    }
    currentPartner = false;
  }

  function sendMessageToPartner(message) {
    let msg = {
      from: 'partner',
      content: message
    };
    if (currentPartner) {
      socket.broadcast.to(currentPartner.id).emit('msg', msg);
    }
  }

  function sendSystemInfo(code) {
    socket.emit('sysinfo', code);
  }

  function waitNext() {
    currentPartner = false;
    isWaiting = true;
  }

  function isValidPartner(partner) {
    if (partner.id !== socket.id && partner.isWaiting()) {
      let isReturningPartner = !!partnersMap[partner.id];
      if (isReturningPartner) {
        let now = Math.floor(Date.now() / 1000);
        let timeSinceLastChat = (now - partnersMap[partner.id].lastChatTimestamp);
        // if timeSinceLastChat > 5 minutes
        return (timeSinceLastChat > 300);
      } return true;
    } return false;
  }
}
