Hooks.on("midi-qol.RollComplete", async (workflow)=>{
    console.log(workflow);

    if (workflow.item.type != 'weapon')
        return;

    let actor = workflow.actor;

    let targets = [];
    for (const item of workflow.targets) {
        targets.push(item.document)
    }

    let weapon = workflow.item.name;
    let hits = []
    for (const item of workflow.hitTargets) {
        hits.push(item.document);
        if (targets.includes(item.document.actorId))
            hits.push(item.document);
    }

    console.log("Name1: " + actor.name);
    console.log("Name2: " + targets[0].name);
    console.log("Weapon: " + weapon);
    console.log(targets);
    console.log(hits);
    let hit = (hits.length > 0 && targets[0].actorId === hits[0].actorId) ? 1 : 0;
    let death = (hit && workflow.damageList && workflow.damageList[0].newHP <= 0) ? 1 : 0;
    console.log("Hits: " + hit);
    console.log("Death: " + death);

    await $.get(`https://dmscreen.net/openai/complete.php?name1=${actor.name}&name2=${targets[0].name}&weapon=${weapon}&death=${death}&hit=${hit}`, json => {
        console.log(json);

        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: json
        };
        ChatMessage.create(chatData, {});
    });




    /*
    console.log(workflow.actor.name);
    console.log(workflow.advantage);
    console.log(workflow.hitTargets.size);
    console.log(workflow.hitTargets);
    console.log(workflow.targets)
    console.log(workflow.targets.size);
    console.log("Targets:")
    for (const item of workflow.targets) {
        console.log(item.document.name);
    }
    console.log("Hits:")
    for (const item of workflow.hitTargets) {
        console.log(item.document.name);
    }
    console.log(workflow.isCritical);
    console.log(workflow.isFumble);
    console.log(workflow.item.name);
    console.log(workflow.autoRollAttack);
    */
});