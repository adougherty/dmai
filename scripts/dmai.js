Hooks.on("midi-qol.RollComplete", async (workflow)=>{
    console.log(workflow);

    switch (workflow.item.type) {
        case 'weapon': await useWeapon(workflow); break;
        case 'feat': await useWeapon(workflow); break;
        case 'spell': await useWeapon(workflow); break;
    }
});

Hooks.on("renderActorSheet", (app, html, data) => {
    // Add Pronounce to character sheet
    let summaryElement = html.find(".summary.flexrow");
    let li = document.createElement('li');
    let input = document.createElement('input');
    input.setAttribute("type", "text");
    input.setAttribute("name", "flags.pronouns");
    input.setAttribute("value", data.actor?.flags?.pronouns ?? "they/them");
    input.setAttribute("placeholder", "Pronouns");
    li.appendChild(input);
    summaryElement[0].insertBefore(li, summaryElement[0].firstChild);

    if (data.actor.type == 'npc') {
        // Add button to dScryb
        let aiBtn = $(`<a class="dmai-dscryb"><i class="fa-solid fa-robot"></i>AI</a>`);
        aiBtn.click(ev => {
            showAIDescription(data.actor.name);
        });
        html.closest('.app').find('.dmai-dscryb').remove();
        let titleElement = html.closest('.app').find('.window-title');
        aiBtn.insertAfter(titleElement);
    }
});

Hooks.on('init', () => {
    // Stop using the AI Features
    game.settings.register('dmai', 'enableDMAI', {
        name: game.i18n.localize("DMAI.settings.enableDMAI.name"),
        hint: game.i18n.localize("DMAI.settings.enableDMAI.hint"),
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.register('dmai', 'gmOnly', {
        name: game.i18n.localize("DMAI.settings.gmOnly.name"),
        hint: game.i18n.localize("DMAI.settings.gmOnly.hint"),
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
});

async function showAIDescription(name) {
    console.log(`Fetching description for ${name}`)
    const api = new URL('http://68.224.63.210:30001/openai/dscryb.php');
    api.searchParams.append("name", name);

    await $.get(api, json => {
        console.log(json);
        let response = JSON.parse(json);
        let txt = response.text.content;
        console.log(txt);
        txt = txt.replaceAll("\n","<br/>\n")
        if (game.modules.get("dmai").version !== response.client_version)
            txt = "<small><i>You are using an old version of DMAI. If you get unexpected results, please update the module</i></small><br/><br/>" + txt;

        let whisper = [];
        if (game.settings.get('dmai', 'gmOnly')) {
            let gmID = game.users.find(u => u.isGM && u.active);
            console.log(gmID);
            if (gmID)
                whisper.push(gmID);
            else
                return;
        }

        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: txt,
            whisper: whisper
        };
        ChatMessage.create(chatData, {});
    });
}

async function useWeapon(workflow) {
    let actor = workflow.actor;

    let targets = getTargets(workflow);
    let hits = getHitTargets(workflow, targets);
    let deaths = getKilledTargets(workflow, targets);
    let applications = getApplicationTargets(workflow, targets);
    let weapon = workflow.item.name;

    let targetNames = targets.map(target => target.name);
    let targetPronouns = targets.map(target => target.actorData?.flags?.pronouns ?? "they/them")

    const api = new URL('http://68.224.63.210:30001/openai/complete.php');

    api.searchParams.append("name1", actor.name);
    api.searchParams.append("name2", targetNames);
    api.searchParams.append("weapon", weapon);
    api.searchParams.append("hit", workflow.damageList ? hits : applications);
    api.searchParams.append("pronouns1", actor?.flags?.pronouns ?? "they/them")
    api.searchParams.append("pronouns2", targetPronouns)
    
    if (workflow.item.labels.damage == '') {
        api.searchParams.append("type", "buff");
    } else {
        api.searchParams.append("death", deaths);
    }

    await $.get(api, json => {
        console.log(json);
        let response = JSON.parse(json);
        let txt = response.text;
        if (game.modules.get("dmai").version !== response.client_version)
            txt = "<small><i>You are using an old version of DMAI. If you get unexpected results, please update the module</i></small><br/><br/>" + txt;

        let whisper = [];
        if (game.settings.get('dmai', 'gmOnly')) {
            let gmID = game.users.find(u => u.isGM && u.active);
            console.log(gmID);
            if (gmID)
                whisper.push(gmID);
            else
                return;
        }

        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: txt,
            whisper: whisper
        };
        ChatMessage.create(chatData, {});


    });
}

function getHitTargets(workflow, targets) {
    let hits = []
    for (const item of targets) {
        let found = workflow.hitTargets.filter(el => {
            return el.document.actorId == item.actorId;
        });
        
        hits.push(found.size);
    }
    return hits;
}

function getKilledTargets(workflow, targets) {
    if (!workflow.damageList)
        return [];

    let killed = [];
    for (const item of targets) {
        let found = workflow.damageList.filter(el => {
            return el.actorId == item.actorId && el.newHP <= 0;
        })
        killed.push(found.length);
    }
    return killed;
}

function getApplicationTargets(workflow, targets) {
    if (!workflow.applicationTargets)
        return [];

    let appt = []
    for (const item of targets) {
        let found = workflow.applicationTargets.filter(el => {
            return el.document.actorId == item.actorId;
        });
        
        appt.push(found.size);
    }
    return appt;
}

function getTargets(workflow) {
    let targets = [];
    for (const item of workflow.targets) {
        targets.push(item.document)
    }
    return targets;    
}
