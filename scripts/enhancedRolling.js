//import {rollStd, rollVs, rollAtkTgt, rollTgt, rollWAtk, rollAtk, rollPwr, } from "../systems/mutants-and-masterminds-3e/module/helpers/common.mjs";
import {getDices, dialogAsk} from "../../../systems/mutants-and-masterminds-3e/module/helpers/common.mjs"

const moduleId = "foundry-mm3-enhanced-rolling"
const moduleName = "MM3 Enhanced Rolling"



// add utility classes to global game object so that they're more easily accessible in global contexts
Hooks.once('init', async function () {
    game.mm3EnhancedRolling = {
        RollMacro
    };
})

// Added shift element allowable for dataKey to give static alteration
export async function rollAtkTgt(actor, name, score, data, tgt, dataKey={}) {
    if(tgt === undefined) return;
    const optDices = getDices();
    const dicesBase = optDices.dices;
    const dicesFormula = optDices.formula;
    const token = canvas.scene.tokens.find(token => token.id === tgt);
    const alt = dataKey?.alt ?? false;
    const shift = dataKey?.shift ?? 0;
  
    let ask = false;
    let mod = 0;
    let total = score;
  
    if(alt) {
      ask = await dialogAsk({mod:alt});
  
      mod = ask?.mod ?? 0;
    }
  
    const dataCbt = data.attaque;
    const dataStr = data.strategie;
    const roll = new Roll(`${dicesBase} + ${total} + ${dataStr.attaque} + ${shift} + ${mod}`);
    await roll.evaluate();
  
    const tokenData = token.actor.system;
    const resultDie = roll.total-total-dataStr.attaque;
    const parade = Number(tokenData.ddparade);
    const esquive = Number(tokenData.ddesquive);
    const sCritique = dataCbt.critique;
    const noCrit = dataCbt.noCrit ? true : false;
    const isArea = dataCbt?.area ?? false;
    const defpassive = dataCbt?.defpassive ?? 'parade';
    const isDmg = dataCbt.isDmg;
    const isAffliction = dataCbt.isAffliction;
    const saveAffliction = dataCbt.saveAffliction;
    const saveType = dataCbt.save;
    const areaBase = parseInt(dataCbt?.basearea ?? 0);
    const areaMod = parseInt(dataCbt?.mod?.area ?? 0);
  
    let ddDefense = 0;
    let traType = "";
    let formula = `${dicesFormula} + ${total} + ${dataStr.attaque}`
    formula += mod === 0 ? '' : ` + ${mod}`
    formula += shift === 0 ? '' : ` + ${shift}`
    // let formula = mod === 0 ? `${dicesFormula} + ${total} + ${dataStr.attaque}` : `${dicesFormula} + ${total} + ${dataStr.attaque} + ${mod}`
  
    ddDefense = defpassive === 'parade' ? parade : esquive;
    traType = defpassive === 'parade' ? game.i18n.localize("MM3.DEFENSE.DDParade") : game.i18n.localize("MM3.DEFENSE.DDEsquive");
  
    let result = {
      hit:roll.total >= ddDefense && resultDie !== 1 ? true : false,
      crit:resultDie >= dataCbt.critique && !noCrit ? true : false,
    };
    let pRoll = {};
  
    if((roll.total >= ddDefense && resultDie !== 1) || (resultDie >= sCritique && !noCrit)) {
      let dSuccess = Math.floor(((roll.total - ddDefense)/5))+1;
  
      let btn = [];
  
      if(isArea) {
        btn.push({
          typeAtk:'area',
          target:tgt,
          saveType:'esquive',
          vs:dataCbt.pwr === "" ? Number(areaBase)+Number(dataStr.effet) : 10+Number(dataCbt.effet)+Number(dataStr.effet)+Number(areaMod),
        });
      }
      else if(isDmg && isAffliction) {
        btn.push({
          typeAtk:'dmg',
          target:tgt,
          saveType:saveType,
          vs:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
        },
        {
          typeAtk:'affliction',
          target:tgt,
          saveType:saveAffliction,
          vs:Number(dataCbt.afflictioneffet)+Number(dataStr.effet)+Number(dataCbt.afflictiondef),
        });
      } else if(isDmg) {
        btn.push({
          typeAtk:'dmg',
          target:tgt,
          saveType:saveType,
          vs:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
        });
      } else if(isAffliction) {
        btn.push({
          typeAtk:'affliction',
          target:tgt,
          saveType:saveType,
          vs:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
        });
      }
  
      pRoll = {
        flavor:name === "" ? " - " : `${name}`,
        tooltip:await roll.getTooltip(),
        formula:formula,
        result:roll.total,
        isCombat:true,
        isSuccess:true,
        defense:ddDefense,
        isCritique:resultDie >= sCritique && !noCrit ? true : false,
        degreSuccess:dSuccess,
        type:traType,
        text:dataCbt.text,
        tgtName:token.actor.name,
        dataAtk:JSON.stringify(dataCbt),
        dataStr:JSON.stringify(dataStr),
        btn:btn,
      };
    } else {
      pRoll = {
        flavor:`${name}`,
        tooltip:await roll.getTooltip(),
        formula:formula,
        result:roll.total,
        isCombat:true,
        isSuccess:false,
        defense:ddDefense,
        type:traType,
        text:dataCbt.text,
        tgtName:token.name,
      };
    }
  
    const rollMsgData = {
      user: game.user.id,
      speaker: {
        actor: actor?.id || null,
        token: actor?.token?.id || null,
        alias: actor?.name || null,
      },
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls:[roll],
      content: await renderTemplate('systems/mutants-and-masterminds-3e/templates/roll/std.html', pRoll),
      sound: CONFIG.sounds.dice
    };
  
    const rMode = game.settings.get("core", "rollMode");
    const msgData = ChatMessage.applyRollMode(rollMsgData, rMode);
  
    await ChatMessage.create(msgData, {
      rollMode:rMode
    });
  
    return result;
  }

export async function rollTgt(actor, name, data, tgt) {
if(tgt === undefined) return;
const actTgt = canvas.scene.tokens.find(token => token.id === tgt);
const dataCbt = data.attaque;
const dataStr = data.strategie;
const isDmg = dataCbt.isDmg;
const isAffliction = dataCbt.isAffliction;
const isArea = dataCbt?.area ?? false;
const saveAffliction = dataCbt.saveAffliction;
const saveType = dataCbt.save;
const areaBase = parseInt(dataCbt?.basearea ?? 0);
const areaMod = parseInt(dataCbt?.mod?.area ?? 0);

let pRoll = {};

let btn = [];

if(isArea) {
    btn.push({
    typeAtk:'area',
    target:tgt,
    saveType:'esquive',
    vs:dataCbt.pwr === "" ? Number(areaBase)+Number(dataStr.effet) : 10+Number(dataCbt.effet)+Number(dataStr.effet)+Number(areaMod),
    });
}
else if(isDmg && isAffliction) {
    btn.push({
    typeAtk:'dmg',
    target:tgt,
    saveType:saveType,
    vs:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
    },
    {
    typeAtk:'affliction',
    target:tgt,
    saveType:saveAffliction,
    vs:Number(dataCbt.afflictioneffet)+Number(dataStr.effet)+Number(dataCbt.afflictiondef),
    });
} else if(isDmg) {
    btn.push({
    typeAtk:'dmg',
    target:tgt,
    saveType:saveType,
    vs:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
    });
} else if(isAffliction) {
    btn.push({
    typeAtk:'affliction',
    target:tgt,
    saveType:saveType,
    vs:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
    });
}

pRoll = {
    flavor:name === "" ? " - " : `${name}`,
    isCombat:true,
    isSuccess:true,
    text:dataCbt.text,
    tgtName:actTgt.name,
    dataAtk:JSON.stringify(dataCbt),
    dataStr:JSON.stringify(dataStr),
    btn:btn
};

const rollMsgData = {
    user: game.user.id,
    speaker: {
    actor: actor?.id || null,
    token: actor?.token?.id || null,
    alias: actor?.name || null,
    },
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    content: await renderTemplate('systems/mutants-and-masterminds-3e/templates/roll/std.html', pRoll),
    sound: CONFIG.sounds.dice
};

const rMode = game.settings.get("core", "rollMode");
const msgData = ChatMessage.applyRollMode(rollMsgData, rMode);

await ChatMessage.create(msgData, {
    rollMode:rMode
});
}
  
export async function rollWAtk(actor, name, data) {
const dataCbt = data.attaque;
const dataStr = data.strategie;

const pRoll = {
    flavor:name === "" ? " - " : `${name}`,
    effet:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
    text:dataCbt.text
};

const rollMsgData = {
    user: game.user.id,
    speaker: {
    actor: actor?.id || null,
    token: actor?.token?.id || null,
    alias: actor?.name || null,
    },
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    content: await renderTemplate('systems/mutants-and-masterminds-3e/templates/roll/std.html', pRoll),
    sound: CONFIG.sounds.dice
};

const rMode = game.settings.get("core", "rollMode");
const msgData = ChatMessage.applyRollMode(rollMsgData, rMode);

await ChatMessage.create(msgData, {
    rollMode:rMode
});
}

export async function rollAtk(actor, name, score, data, dataKey={}) {
    const optDices = getDices();
    const dicesBase = optDices.dices;
    const dicesFormula = optDices.formula;

    const dataCbt = data.attaque;
    const dataStr = data.strategie;
    const noCrit = dataCbt.noCrit ? true : false;
    const alt = dataKey?.alt ?? false;

    let ask = false;
    let mod = 0;
    let total = score;

    if(alt) {
        ask = await dialogAsk({mod:alt});

        mod = ask?.mod ?? 0;
    }

    let formula = mod === 0 ? `${dicesFormula} + ${total} + ${dataStr.attaque}` : `${dicesFormula} + ${total} + ${dataStr.attaque} + ${mod}`;
    let fRoll = mod === 0 ? `${dicesBase} + ${total} + ${dataStr.attaque}` : `${dicesBase} + ${total} + ${dataStr.attaque} + ${mod}`;

    const roll = new Roll(fRoll);
    await roll.evaluate();

    const resultDie = roll.total-total-dataStr.attaque;

    const pRoll = {
        flavor:name === "" ? " - " : `${name}`,
        tooltip:await roll.getTooltip(),
        formula:formula,
        result:roll.total,
        isCritique:resultDie >= dataCbt.critique && !noCrit ? true : false,
        effet:Number(dataCbt.effet)+Number(dataStr.effet)+Number(dataCbt.basedef),
        text:dataCbt.text
    };

    const rollMsgData = {
        user: game.user.id,
        speaker: {
        actor: actor?.id || null,
        token: actor?.token?.id || null,
        alias: actor?.name || null,
        },
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        rolls:[roll],
        content: await renderTemplate('systems/mutants-and-masterminds-3e/templates/roll/std.html', pRoll),
        sound: CONFIG.sounds.dice
    };

    const rMode = game.settings.get("core", "rollMode");
    const msgData = ChatMessage.applyRollMode(rollMsgData, rMode);

    await ChatMessage.create(msgData, {
        rollMode:rMode
    });
}

export async function rollPwr(actor, id, dataKey={}) {
    const optDices = game.settings.get("mutants-and-masterminds-3e", "typeroll");
    const pwr = actor.items.filter(item => item.id === id)[0];
    const type = pwr.system.special;
    const rang = type === 'dynamique' ? actor.system.pwr[id].cout.rang : pwr.system.cout.rang;
    const name = pwr.name;
    const baseCrit = optDices === '3D6' ? 18 : 20;
    const alt = dataKey?.alt ?? false;
    let dices = `1D20`;
    let fDices = optDices === '3D20' ? '3D20' : '1D20';
  
    if(optDices === '3D20') dices = '3D20dldh';
    else if(optDices === '3D6') dices = '3D6';
  
    let ask = false;
    let mod = 0;
  
    if(alt) {
      ask = await dialogAsk({mod:alt});
  
      mod = ask?.mod ?? 0;
    }
  
    const formula = mod === 0 ? `${fDices} + ${rang}` : `${fDices} + ${rang} + ${mod}`;
    const fRoll = mod === 0 ? `${dices} + ${rang}` : `${dices} + ${rang} + ${mod}`;
    const roll = new Roll(fRoll);
    await roll.evaluate();
    const resultDie = roll.total-rang;
  
    const pRoll = {
      flavor:`${name}`,
      tooltip:await roll.getTooltip(),
      formula:formula,
      result:roll.total,
      isCritique:resultDie >= baseCrit ? true : false,
      action:pwr.system.action,
      portee:pwr.system.portee,
      duree:pwr.system.duree,
      descripteurs:Object.keys(pwr.system.descripteurs).length === 0 ? false : pwr.system.descripteurs,
      description:pwr.system.notes,
      effet:pwr.system.effets
    };
  
    const rollMsgData = {
      user: game.user.id,
      speaker: {
        actor: actor?.id || null,
        token: actor?.token?.id || null,
        alias: actor?.name || null,
      },
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls:[roll],
      content: await renderTemplate('systems/mutants-and-masterminds-3e/templates/roll/pwr.html', pRoll),
      sound: CONFIG.sounds.dice
    };
  
    const rMode = game.settings.get("core", "rollMode");
    const msgData = ChatMessage.applyRollMode(rollMsgData, rMode);
  
    await ChatMessage.create(msgData, {
      rollMode:rMode
    });
}

async function RollMacro(actorId, targetIds, sceneId, tokenId, type, what, id, author, event) {
    console.warn(actorId, sceneId, tokenId);
    const actor = tokenId === 'null' ? game.actors.get(actorId) : game.scenes.get(sceneId).tokens.find(token => token.id === tokenId).actor;
    
    const data = actor.system;
    const tgt = game.user.targets.ids[0];
    const dataStr = data?.strategie?.total ?? {attaque:0, effet:0};
    const strategie = {attaque:dataStr.attaque, effet:dataStr.effet};
    const hasShift = event.shiftKey;
    const hasAlt = event.altKey;
    
    const atk = id === '-1' || id === -1 ? {noAtk:false} : game.mm3.getAtk(actor, id)?.data ?? "";
    let name = "";
    let total = 0;
  
    switch(type) {
      case 'caracteristique':
        name = author === 'vehicule' ? game.i18n.localize(CONFIG.MM3.vehicule[what]) : game.i18n.localize(CONFIG.MM3.caracteristiques[what]);
        total = data.caracteristique[what].total;
        break;
        
      case 'defense':
        name = game.i18n.localize(CONFIG.MM3.defenses[what]);
        total = data.defense[what].total;
        break;
      
      case 'competence':
        if(what === 'combatcontact' || what === 'combatdistance' || what === 'expertise') {
          name = data[type][what].list[id].label;
          total = data[type][what].list[id].total;
        } else {
          name = id === 'new' ? data[type][what].label : game.i18n.localize(CONFIG.MM3.competences[what]);
          total = data[type][what].total;
        }
        break;
      
      case 'attaque':
        console.log(atk)
        const typeAtk = atk.type;
        const idSkill = atk.skill;
  
        if(typeAtk === 'combatcontact' || typeAtk === 'combatdistance') {
          let skill = game.mm3.getDataSubSkill(actor, typeAtk, idSkill);
          name = skill.label;
          total = skill.total;
        } else if(typeAtk === 'other') {
          name = atk.label;
          total = atk.attaque;
        }
        break;
    }
  
    let result = undefined;
  
    if(type === 'attaque' && tgt !== undefined && atk.noAtk) {
      for(let t of game.user.targets.ids) {
        rollTgt(actor, name, {attaque:atk, strategie:strategie}, t);
      }
    } else if(type === 'attaque' && tgt !== undefined && !atk.noAtk) {
      result = {};
  
      // Allows targets to be specified so scripts can differentiate targets for categorization (say for an effect with diminishing power over range)
      let targets = Array.isArray(targetIds) ? targetIds : targetIds !== undefined ? [targetIds] : game.user.targets.ids
      for(let t of targets) {
        let roll = await rollAtkTgt(actor, name, total, {attaque:atk, strategie:strategie}, t, {alt:hasAlt, shift:hasShift});
        result[t] = roll;
      }
    } 
    else if(type === 'attaque' && tgt === undefined && !atk.noAtk)
    {
        rollAtk(actor, name, total, {attaque:atk, strategie:strategie}, {alt:hasAlt});
    }
    else if(type === 'attaque' && atk.noAtk) 
    {
        rollWAtk(actor, name, {attaque:atk, strategie:strategie});
    }
    else 
    {
        rollStd(actor, name, total, {shift:hasShift, alt:hasAlt});
    }
  
    return result;
};
  