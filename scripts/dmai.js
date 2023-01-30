Hooks.on("midi-qol.RollComplete", async (workflow)=>{
    console.log(workflow);

    switch (workflow.item.type) {
        case 'weapon': await useWeapon(workflow); break;
        case 'feat': await useWeapon(workflow); break;
        case 'spell': await useWeapon(workflow); break;
    }

});

async function useWeapon(workflow) {
    let actor = workflow.actor;

    let targets = getTargets(workflow);
    let hits = getHitTargets(workflow, targets);
    let deaths = getKilledTargets(workflow, targets);
    let applications = getApplicationTargets(workflow, targets);
    let weapon = workflow.item.name;

    let targetNames = [];
    targets.forEach(target => {
        targetNames.push(target.name);
    });
    let sTargets = targetNames.join(',');
    let hit = hits.join(',');
    let death = deaths.join(',');
    let application = applications.join(',');
    console.log(death);
    console.log(applications);

    let useHits = (workflow.damageList) ? hit : application;

    let uri = encodeURI(`https://dmscreen.net/openai/complete.php?name1=${actor.name}&name2=${targetNames}&weapon=${weapon}&death=${death}&hit=${useHits}`);
    await $.get(uri, json => {
        //console.log(json);
        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: json
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