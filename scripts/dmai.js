Hooks.on("midi-qol.RollComplete", async (workflow)=>{
    console.log(workflow);

    switch (workflow.item.type) {
        case 'weapon': await useWeapon(workflow); break;
        case 'feat': await useWeapon(workflow); break;
        case 'spell': await useWeapon(workflow); break;
    }
});

Hooks.on("renderActorSheet", (app, html, data) => {

    console.log(data);
    let summaryElement = html.find(".summary.flexrow");
    let li = document.createElement('li');
    let input = document.createElement('input');
    input.setAttribute("type", "text");
    input.setAttribute("name", "flags.pronouns");
    input.setAttribute("value", data.actor.flags.pronouns || "they/them");
    input.setAttribute("placeholder", "Pronouns");
    li.appendChild(input);
    summaryElement[0].insertBefore(li, summaryElement[0].firstChild);
});

Hooks.on("updateActor", (actor, updateData) => {
    console.log(updateData);
});

async function useWeapon(workflow) {
    let actor = workflow.actor;

    let targets = getTargets(workflow);
    let hits = getHitTargets(workflow, targets);
    let deaths = getKilledTargets(workflow, targets);
    let applications = getApplicationTargets(workflow, targets);
    let weapon = workflow.item.name;

    let targetNames = targets.map(target => target.name);
    let targetPronouns = targets.map(target => target.actorData.flags.pronouns)
    console.log(targetNames);
    console.log(targetPronouns);

    const api = new URL('http://dmscreen.net:30001/openai/complete.php');

    api.searchParams.append("name1", actor.name);
    api.searchParams.append("name2", targetNames);
    api.searchParams.append("weapon", weapon);
    api.searchParams.append("hit", workflow.damageList ? hits : applications);
    api.searchParams.append("pronouns1", actor.flags.pronouns)
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
        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: txt
        };
        ChatMessage.create(chatData, {});
    });
}

async function useFeat(workflow) {
    let actor = workflow.actor;
    let targets = getTargets(workflow);

    if (targets.length > 1) {

    }
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
