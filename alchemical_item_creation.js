// CONFIGURATION
const c = {
    'acid': {'price': 10, 'dc': 15, 'name': 'Acid'},
    'fire': {'price': 20, 'dc': 20, 'name': 'Alchemist\'s fire'},
    'antiplague': {'price': 50, 'dc': 25, 'name': 'Antiplague/Antitoxin'},
    'blanch-silver': {'price': 5, 'dc': 20, 'name': 'Weapon Blanch (silver)'},
    'blanch-ci': {'price': 20, 'dc': 20, 'name': 'Weapon Blanch (cold iron)'},
    'blanch-ghost': {'price': 200, 'dc': 20, 'name': 'Weapon Blanch (ghost)'},
};
// END CONFIGURATION

let toChat = (content, rollString) => {
        let chatData = {
                user: game.user.id,
                content,
                speaker: ChatMessage.getSpeaker(),
        }
        ChatMessage.create(chatData, {})
        if (rollString) {
                let roll = new Roll(rollString).roll();
                chatData = {
                        ...chatData,
                        flavor: "Crafting Results",
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        roll
                    }
                ChatMessage.create(chatData, {})
        }
        
}

let rollCrafting = (args) => {
    let [item, itemName, price, dc, craftMod, dayroll, progress_last, charName] = args; // add day roll
    var roll = new Roll(`d20`).roll().total;
    let check = roll + craftMod + 2
    let progress = (check * dc) + progress_last; // +2 for trait, should be changed manually
    let price_paid = price / 3
    let message = 'Crafting {0}, supplying {1} gp. </br> Craft (alchemy) check: [[{2}+{3}]], DC {4} </br> </br>'.format(itemName, price_paid.toFixed(2), roll, craftMod+2, dc);

    if (check > dc && progress >= price * 10 && roll > 1) {
        let speed = Math.floor(progress / (price * 10));
        if (speed == 1) {
            toChat('{0} {1} created {2} in one week.'.format(message, charName, itemName));
        } else {
            toChat('{0} {1} created {2} in 1/{3} of a week!'.format(message, charName, itemName, speed));
        }
    } else {
        if (check > dc && progress < price*10){
        toChat('{0} {1} failed to create {2} this time, but made a progress of {3}/{4}.'.format(message, charName, itemName, progress, price*10));
    } else {toChat('{0} {1} failed to create {2} this time'.format(message, charName, itemName, progress, price*10));}
    }
};

const tokens = canvas.tokens.controlled;
var actors = tokens.map(o => o.actor);

if (!actors.length) {ui.notifications.warn("No applicable actor(s) found");}
else {
    let actor = actors[0];
    const msg = `
    <form>
    <input type="radio" id="acid" name="itemName" value="acid">
    <label for="acid">Acid</label><br><br>

    <input type="radio" id="fire" name="itemName" value="fire">
    <label for="fire">Alchemist\'s fire</label><br><br>

    <input type="radio" id="antiplague" name="itemName" value="antiplague">
    <label for="antiplague">Antiplague/Antitoxin</label><br><br>

    <input type="radio" id="blanch-silver" name="itemName" value="blanch-silver">
    <label for="blanch-silver">Weapon Blanch (silver)</label><br><br>

    <input type="radio" id="blanch-ci" name="itemName" value="blanch-ci">
    <label for="blanch-ci">Weapon Blanch (cold iron)</label><br><br>

    <input type="radio" id="blanch-ghost" name="itemName" value="blanch-ghost">
    <label for="blanch-ghost">Weapon Blanch (ghost)</label><br><br>
    <div class="form-group">
        <label>Progress made last time:</label>
        <input id="progress" name="progress" type="number"/>
    </div>

    <div class="form-group">
        <label>Roll for a single day?</label>
        <input id="day-roll" name="day-roll" type="checkbox" value="day-roll"/>
    </div>

    </form>`;

    let applyChanges = false;
    new Dialog({
        title: "Crafting roll",
        content: '<p>{0}</p>'.format(msg),
        buttons: {
            yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: 'Start crafting!',
                    callback: () => applyChanges = true
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: 'Cancel',
                    callback: () => applyChanges = false
                },
            },
        default: "yes",
        close: html => {
            if (applyChanges) {
                let charName = actor.name;
                let craftMod = actor.data.data.skills.crf.subSkills.crf1.mod;
                let items = html.find('[name="itemName"]');
                for (var i = 0; i < items.length; i++) {
                    if (items[i].checked) {
                        let item = items[i].value;

                        let dayroll = html.find('[name="day-roll"]')[0].checked;
                        let progress = parseInt(html.find('[name="progress"]')[0].value) || 0;
                        return rollCrafting([item, c[item]['name'], c[item]['price'], c[item]['dc'], craftMod, dayroll, progress, charName]);
                    }
                }
                return;
            }
        }
    }).render(true);
}
