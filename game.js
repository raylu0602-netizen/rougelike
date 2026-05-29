// ================= 輔助工具 =================
function logMessage(msg) {
    const logBox = document.getElementById('log-box');
    logBox.innerHTML += `<div>${msg}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ================= 卡牌系統 (Data-Driven) =================
class Card {
    // ✨ 使用物件解構，這樣無論參數加到多少個、順序怎麼換，都絕對不會認錯人！
    constructor({ name, type, cost, value = 0, drawNum = 0, energyNum = 0, maxEnergyNum = 0, healNum = 0, strengthNum = 0, lifestealRate = 0, shieldConsume = 0, shieldMult = 0, poisonNum = 0, detonatePoisonMult = 0 }) {
        this.name = name;
        this.type = type;
        this.cost = cost;
        this.value = value;
        this.drawNum = drawNum;
        this.energyNum = energyNum;
        this.maxEnergyNum = maxEnergyNum;
        this.healNum = healNum;
        this.strengthNum = strengthNum;
        this.lifestealRate = lifestealRate; 
        this.shieldConsume = shieldConsume; 
        this.shieldMult = shieldMult;       
        this.poisonNum = poisonNum;
        this.detonatePoisonMult = detonatePoisonMult;
    }

    getDescription() {
        let desc = [];
        if (this.type === 'power') {
            desc.push(`<span class="exhaust-tag">⚠️ 消耗</span>`);
            desc.push(`永久增益`);
        }
        
        let currentLevel = player.starterUpgradeLevel + 1; 
        if (this.name.startsWith("無限連鎖")) {
            desc.push(`此戰鬥中，每當你打出任何卡牌，對敵人造成 ${1 * currentLevel} 點<span style="color:#e67e22; font-weight:bold;">無視反傷</span>的傷害。`);
            return desc.join('<br>');
        }
        if (this.name.startsWith("鋼鐵意志")) {
            desc.push(`此戰鬥中，每當你獲得護甲，額外多獲得 ${3 * currentLevel} 點護甲。`);
            return desc.join('<br>');
        }
        if (this.name.startsWith("狂暴戰吼")) {
            desc.push(`此戰鬥中，每當你打出一張【攻擊】牌，力量永久 +${1 * currentLevel}。`);
            return desc.join('<br>');
        }
        // ✨ 劇毒配方敘述
        if (this.name.startsWith("劇毒配方")) {
            desc.push(`此戰鬥中，每當你打出一張【技能】牌，給予敵人 ${1 * currentLevel} 層 <span style="color:#2ecc71; font-weight:bold;">中毒</span>。`);
            return desc.join('<br>');
        }
        
        if (this.type === 'attack') {
            let currentDmg = this.value + (player.strength || 0);
            
            if (this.detonatePoisonMult > 0) {
                let currentPoison = enemy ? enemy.poison : 0;
                let bonus = currentPoison * this.detonatePoisonMult;
                let total = currentDmg + bonus;
                desc.push(`清除敵人所有中毒，每層造成 ${this.detonatePoisonMult} 點額外傷害。<br>造成 <span style="color:#e74c3c; font-weight:bold;">${total}</span> 傷害 <span style="font-size: 0.8em; color: #bdc3c7;">(基礎 ${currentDmg} + 引爆 ${bonus})</span>`);
            }
            else if (this.shieldConsume > 0) {
                let consumedBlock = Math.floor((player.block || 0) * this.shieldConsume);
                let bonus = consumedBlock * this.shieldMult;
                let total = currentDmg + bonus;
                let consumePercent = Math.round(this.shieldConsume * 100);
                desc.push(`消耗 ${consumePercent}% 護甲，造成 <span style="color:#e74c3c; font-weight:bold;">${total}</span> 傷害`);
                desc.push(`<span style="font-size: 0.8em; color: #bdc3c7;">(基礎 ${currentDmg} + 護甲轉換 ${bonus})</span>`);
            } else if ((player.strength || 0) > 0) {
                desc.push(`造成 <span style="color:#e74c3c; font-weight:bold;">${currentDmg}</span> 傷害`);
            } else {
                desc.push(`造成 ${this.value} 傷害`);
            }
        }
        
        if (this.type === 'defend') desc.push(`獲得 ${this.value} 護甲`);
        if (this.healNum > 0) desc.push(`恢復 ${this.healNum} 點血量`);
        
        if (this.lifestealRate > 0) {
            let ratePercent = Math.round(this.lifestealRate * 100);
            desc.push(`<span style="color:#2ecc71; font-weight:bold;">🧛 吸血</span> (恢復實際傷害 ${ratePercent}% 的血量)`);
        }
        
        if (this.poisonNum > 0) desc.push(`給予敵人 ${this.poisonNum} 層 <span style="color:#2ecc71; font-weight:bold;">中毒</span>`);
        if (this.name === "催化劑") desc.push(`將敵人的中毒層數 <span style="color:#2ecc71; font-weight:bold;">翻倍</span>`);
        
        if (this.drawNum > 0) desc.push(`抽 ${this.drawNum} 張牌`);
        if (this.energyNum > 0) desc.push(`回能 ${this.energyNum}`);
        if (this.maxEnergyNum > 0) desc.push(`能量上限 +${this.maxEnergyNum}`);
        if (this.strengthNum > 0) desc.push(`獲得 ${this.strengthNum} 點力量`);
        
        return desc.join('<br>');
    }
}

function createCard(cardName) {
    let data = CARD_POOL.find(c => c.name === cardName);
    if (!data) return null;
    // ✨ 直接把整個 data 物件丟進去，JavaScript 會自動對齊名稱，永遠不會再發生位置錯位！
    return new Card(data);
}

// 統一定義所有卡牌資料庫
const CARD_POOL = [
    // 基礎與進階
    { name: "打擊", type: "attack", cost: 1, value: 8, price: 20 },
    { name: "防禦", type: "defend", cost: 1, value: 6, price: 20 },
    { name: "備用方案", type: "skill", cost: 1, value: 0, drawNum: 2, price: 30 },
    { name: "重擊", type: "attack", cost: 2, value: 20, price: 35 },
    { name: "鐵壁", type: "defend", cost: 2, value: 15, price: 35 },
    { name: "連擊準備", type: "skill", cost: 2, value: 0, drawNum: 4, price: 40 },
    { name: "急救包", type: "skill", cost: 1, value: 0, drawNum: 0, healNum: 10, price: 35 },
    { name: "飛刀", type: "attack", cost: 0, value: 4, price: 25 },
    { name: "腎上腺素", type: "skill", cost: 1, value: 0, energyNum: 2, drawNum: 1, price: 45 },
    { name: "過載模組", type: "power", cost: 2, value: 0, maxEnergyNum: 1, price: 50 },
    { name: "戰鬥冥想", type: "skill", cost: 1, value: 0, drawNum: 2, energyNum: 1, price: 55 },
    { name: "無中生有", type: "skill", cost: 0, value: 0, drawNum: 1, energyNum: 1, price: 45 },
    
    // 吸血與護甲轉換流派
    { name: "吸血劍", type: "attack", cost: 2, value: 8, lifestealRate: 0.5, price: 50 },
    { name: "嗜血狂襲", type: "attack", cost: 3, value: 15, lifestealRate: 1.0, price: 80, isExclusive: true },
    { name: "盾牌衝撞", type: "attack", cost: 1, value: 0, shieldConsume: 0.5, shieldMult: 2, price: 65 },
    { name: "背水一戰", type: "attack", cost: 0, value: 5, shieldConsume: 1.0, shieldMult: 1, price: 55 },
    // 中毒流派
    { name: "致命塗毒", type: "skill", cost: 1, value: 0, poisonNum: 4, price: 40 },
    { name: "毒霧", type: "skill", cost: 2, value: 0, poisonNum: 3, drawNum: 2, price: 55 },
    { name: "毒素引爆", type: "attack", cost: 1, value: 3, detonatePoisonMult: 2, price: 65 },
    
    // 商店限定卡
    { name: "神羅天徵", type: "attack", cost: 3, value: 40, price: 70, isExclusive: true },
    { name: "絕對防禦", type: "defend", cost: 2, value: 35, price: 60, isExclusive: true },
    { name: "絕對領域", type: "skill" , cost: 2, value: 0, maxEnergyNum: 2,energyNum: 1, price: 75, isExclusive: true },
    { name: "貪婪之壺", type: "skill", cost: 0, value: 0, drawNum: 3, price: 90, isExclusive: true },

    // 流派開局專屬卡 (隱藏於商店與掉落)
    { name: "無限連鎖", type: "power", cost: 0, value: 0, price: 0, isExclusive: true, isStarter: true },
    { name: "狂暴戰吼", type: "power", cost: 0, value: 0, price: 0, isExclusive: true, isStarter: true },
    { name: "鋼鐵意志", type: "power", cost: 0, value: 0, price: 0, isExclusive: true, isStarter: true },
    { name: "劇毒配方", type: "power", cost: 0, value: 0, price: 0, isExclusive: true, isStarter: true }, // 放進專屬卡區
];


e=3;

// ================= 玩家與遊戲狀態 =================
let player = {
    hp: 50, maxHp: 50, block: 0, 
    energy: e, maxEnergy: e, gold: 30, strength: 0,
    deck: [], drawPile: [], hand: [], discardPile: [],
    
    // 專屬卡無限升級次數與戰鬥狀態追蹤
    starterUpgradeLevel: 0, 
    infiniteChainLevel: 0,
    ironWillLevel: 0,
    berserkerRoarLevel: 0,
    toxicRecipeLevel: 0,
};

let enemy = null;
let floor = 1;
let shopStock = { regular: [], exclusive: [] };
const DELETE_COST = 35;

// ================= 核心戰鬥邏輯 =================
function chooseArchetype(archetypeType) {
    player.deck = [];
    for(let i = 0; i < 4; i++) {
        player.deck.push(createCard("打擊"));
        player.deck.push(createCard("防禦"));
    }
    player.deck.push(createCard("備用方案"));
    player.deck.push(createCard("過載模組"));

    if (archetypeType === 'infinite') {
        player.deck.push(createCard("無限連鎖"));
        logMessage("🌀 你選擇了【無限連擊流】！專屬卡已加入牌組。");
    } else if (archetypeType === 'strength') {
        player.deck.push(createCard("狂暴戰吼"));
        logMessage("🔥 你選擇了【極致力量流】！專屬卡已加入牌組。");
    } else if (archetypeType === 'shield') {
        player.deck.push(createCard("鋼鐵意志"));
        logMessage("🛡️ 你選擇了【鋼鐵盾甲流】！專屬卡已加入牌組。");
    }
    else if (archetypeType === 'poison') {
        player.deck.push(createCard("劇毒配方"));
        logMessage("🧪 你選擇了【致命劇毒流】！專屬卡已加入牌組。");
    }
    document.getElementById('archetype-screen').classList.add('hidden');
    enemy = new Enemy(1);
    startBattle();
}

function startBattle() {
    logMessage(`<b>=== 第 ${floor} 層戰鬥開始 ===</b>`);
    player.drawPile = [...player.deck];
    shuffle(player.drawPile);
    player.hand = [];
    player.discardPile = [];
    player.maxEnergy = e;
    player.block = 0; 
    player.strength = 0; 
    
    // 重置流派被動
    player.infiniteChainLevel = 0;
    player.ironWillLevel = 0;
    player.berserkerRoarLevel = 0; 
    player.toxicRecipeLevel = 0;
    
    startTurn();
}

function drawCards(num) {
    for(let i=0; i<num; i++) {
        if (player.hand.length >= 10) {
            logMessage("⚠️ 手牌已達上限 (10張)！");
            break; 
        }
        if (player.drawPile.length === 0) {
            if (player.discardPile.length === 0) break;
            logMessage("🔄 洗牌中...");
            player.drawPile = [...player.discardPile];
            player.discardPile = [];
            shuffle(player.drawPile);
        }
        player.hand.push(player.drawPile.pop());
    }
    updateUI();
}

function startTurn() {
    player.energy = player.maxEnergy;
    drawCards(5);
}

function playCard(index) {
    let card = player.hand[index];
    if (player.energy >= card.cost) {
        player.energy -= card.cost;
        player.hand.splice(index, 1); 
        
        if (card.type !== 'power') {
            player.discardPile.push(card);
        }

        // 啟動流派被動 (讀取無限升級倍率)
        let currentLevel = player.starterUpgradeLevel + 1;
        if (card.name.startsWith("無限連鎖")) player.infiniteChainLevel = currentLevel;
        if (card.name.startsWith("鋼鐵意志")) player.ironWillLevel = currentLevel;
        if (card.name.startsWith("狂暴戰吼")) player.berserkerRoarLevel = currentLevel;
        if (card.name.startsWith("劇毒配方")) player.toxicRecipeLevel = currentLevel;
        if (player.toxicRecipeLevel > 0 && card.type === 'skill') {
            if (typeof enemy.poison !== 'number' || isNaN(enemy.poison)) {
                enemy.poison = 0;
            }
            let poisonBonus = 1 * player.toxicRecipeLevel;
            enemy.poison += poisonBonus;
            logMessage(`🧪 【劇毒配方】觸發！給予敵人 ${poisonBonus} 層中毒 (目前: ${enemy.poison}層)`);
        }
        // 1. 執行攻擊與防禦邏輯
        if (card.type === 'attack') {
            let totalDmg = card.value + player.strength; 
            if (card.detonatePoisonMult > 0 && enemy.poison > 0) {
                let detonateDmg = enemy.poison * card.detonatePoisonMult;
                totalDmg += detonateDmg; // 加進總傷害
                
                logMessage(`💥 引爆毒素！消耗了 ${enemy.poison} 層中毒，轉化為 ${detonateDmg} 點額外傷害！`);
                enemy.poison = 0; // 清除敵人的中毒層數
            }
            // 護甲轉換傷害
            if (card.shieldConsume > 0) {
                let consumedBlock = Math.floor(player.block * card.shieldConsume); 
                let bonusDmg = consumedBlock * card.shieldMult;                 
                totalDmg += bonusDmg;       
                player.block -= consumedBlock; 
                logMessage(`🛡️ 發動盾牌效果！消耗了 ${consumedBlock} 點護甲，轉化為 ${bonusDmg} 點額外傷害！`);
            }
            
            // 計算護甲抵銷並造成傷害
            let actualEnemyDmg = Math.max(0, totalDmg - enemy.block);
            enemy.block = Math.max(0, enemy.block - totalDmg);
            enemy.hp -= actualEnemyDmg;
            logMessage(`🗡️ 【${card.name}】對敵人造成 ${actualEnemyDmg} 傷害`);
            
            // 吸血邏輯
            if (card.lifestealRate > 0 && actualEnemyDmg > 0) {
                let lifestealAmt = Math.floor(actualEnemyDmg * card.lifestealRate);
                if (lifestealAmt > 0) {
                    player.hp = Math.min(player.maxHp, player.hp + lifestealAmt);
                    logMessage(`🧛 觸發吸血！恢復了 ${lifestealAmt} 點血量。`);
                }
            }
            
            // 反傷機制 (刺蝟)
            if (enemy.type === 'spiky') {
                let thornDmg = 1 + Math.floor(floor / 3); 
                let actualThornDmgToHp = Math.max(0, thornDmg - player.block);
                let blockedByArmor = thornDmg - actualThornDmgToHp;
                player.block = Math.max(0, player.block - thornDmg);
                player.hp -= actualThornDmgToHp;
                
                if (blockedByArmor > 0 && actualThornDmgToHp > 0) {
                     logMessage(`💥 被反傷！護甲抵擋 ${blockedByArmor} 點，仍受到 ${actualThornDmgToHp} 傷害。`);
                } else if (actualThornDmgToHp === 0) {
                     logMessage(`🛡️ 被反傷！但被護甲完美抵擋。`);
                } else {
                     logMessage(`💥 被反傷！受到 ${actualThornDmgToHp} 點傷害。`);
                }
            }

            // 力量流被動：每打出攻擊牌增加力量
            if (player.berserkerRoarLevel > 0) {
                let strBonus = 1 * player.berserkerRoarLevel; 
                player.strength += strBonus;
                logMessage(`🔥 【狂暴戰吼】觸發！力量成長為 ${player.strength}`);
            }

        } else if (card.type === 'defend') {
            let finalBlock = card.value;
            // 盾甲流被動：額外獲得護甲
            if (player.ironWillLevel > 0) {
                let extra = 6 * player.ironWillLevel; 
                finalBlock += extra;
                logMessage(`🛡️ 護甲獲得【鋼鐵意志】額外 +${extra} 強化！`);
            }
            player.block += finalBlock;
            logMessage(`🛡️ 【${card.name}】獲得 ${finalBlock} 護甲`);
        }

        // 2. 執行卡牌特殊效果
        if (card.drawNum > 0) drawCards(card.drawNum);
        if (card.energyNum > 0) {
            player.energy += card.energyNum;
            logMessage(`⚡ 獲得 ${card.energyNum} 點能量！`);
        }
        if (card.maxEnergyNum > 0) {
            player.maxEnergy += card.maxEnergyNum;
            logMessage(`🚀 能量上限提升至 ${player.maxEnergy}`);
        }
        if (card.healNum > 0) {
            player.hp = Math.min(player.maxHp, player.hp + card.healNum);
            logMessage(`💖 恢復了 ${card.healNum} 點血量！`);
        }
        if (card.strengthNum > 0) {
            player.strength += card.strengthNum;
            logMessage(`💪 力量提升！目前的攻擊力額外 +${player.strength}`);
        }

        // 無限流被動：每打一張牌造成無視反傷的傷害
        if (player.infiniteChainLevel > 0) {
            let dmg = 1 * player.infiniteChainLevel; 
            enemy.hp -= dmg; 
            logMessage(`⚡ 【連鎖反應】爆發！對怪物造成 ${dmg} 點無視反傷傷害！`);
        }
        // ✨ 一般卡牌給予中毒
        if (card.poisonNum > 0) {
            enemy.poison += card.poisonNum;
            logMessage(`🧪 給予敵人 ${card.poisonNum} 層中毒 (目前: ${enemy.poison}層)`);
        }
        
        // ✨ 神卡催化劑效果
        if (card.name === "催化劑") {
            enemy.poison *= 2;
            logMessage(`💥 【催化劑】爆發！敵人中毒層數翻倍為 ${enemy.poison} 層！`);
        }
        updateUI();
        checkWinCondition();
    } else {
        logMessage("⚠️ 能量不足！");
    }
}

function endTurn() {
    player.discardPile.push(...player.hand);
    player.hand = [];
    if (enemy.poison > 0) {
        enemy.hp -= enemy.poison;
        logMessage(`🤢 毒發！敵人受到 ${enemy.poison} 點中毒傷害！`);
        enemy.poison = Math.max(0, enemy.poison - 1); // 層數 -1
        
        // 如果毒死了，就直接結算勝利並提早結束回合
        if (enemy.hp <= 0) {
            updateUI();
            checkWinCondition();
            return; 
        }
    }
    enemy.executeIntent(player);

    if (player.hp <= 0) {
        alert("💀 遊戲結束！重新選個流派再來挑戰吧。");
        location.reload(); 
        return;
    }
    
    updateUI();
    startTurn();
}

// ================= 勝利與推進邏輯 =================
function checkWinCondition() {
    if (enemy.hp <= 0) {
        let goldEarned = Math.floor(Math.random() * 11) + 15;
        
        if (enemy.isElite) {
            goldEarned += 25;
            player.maxHp += 3;
            player.hp += 3;
            logMessage(`🏆 擊敗菁英怪物！最大血量提升 3 點！`);
        }
        
        player.gold += goldEarned;
        logMessage(`🎉 戰鬥勝利！總共獲得 ${goldEarned} 金幣。`);
        player.hp = Math.min(player.maxHp, player.hp + 10);
        showRewardScreen();
    }
}

function showRewardScreen() {
    const rewardScreen = document.getElementById('reward-screen');
    const rewardCardsContainer = document.getElementById('reward-cards');
    rewardCardsContainer.innerHTML = ''; 
    
    // 一般掉落不過濾 isExclusive，因為那些都不會在掉落池
    let availablePool = CARD_POOL.filter(c => !c.isExclusive);
    shuffle(availablePool);
    let options = availablePool.slice(0, 3);
    
    options.forEach((cardData) => {
        let cardObj = createCard(cardData.name);
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.onclick = () => selectReward(cardObj); 
        cardDiv.innerHTML = `
            <div class="card-header"><span>${cardObj.name}</span><div class="card-cost">${cardObj.cost}</div></div>
            <div class="card-desc">${cardObj.getDescription()}</div>
        `;
        rewardCardsContainer.appendChild(cardDiv);
    });
    rewardScreen.classList.remove('hidden');
}

function selectReward(card) {
    player.deck.push(card);
    proceedToNextFloor();
}

function skipReward() {
    proceedToNextFloor();
}

function proceedToNextFloor() {
    document.getElementById('reward-screen').classList.add('hidden');
    floor++;
    // 每 4 層進商店
    if (floor % 4 === 0) {
        enterShop();
    } else {
        prepareNextBattle();
    }
}

function prepareNextBattle() {
    enemy = new Enemy(floor);
    startBattle();
}

// ================= 敵人 AI 系統 =================
class Enemy {
    constructor(floor) {
        this.floor = floor;
        this.isElite = (floor % 4 === 3); 
        
        if (this.isElite) {
            const eliteTypes = ['spiky', 'minotaur'];
            this.type = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
            this.hp = 50 + (floor * 15);
        } else {
            const normalTypes = ['slime', 'goblin'];
            this.type = normalTypes[Math.floor(Math.random() * normalTypes.length)];
            this.hp = 30 + (floor * 10);
        }
        
        this.maxHp = this.hp;
        this.block = 0;
        this.strength = 0;
        this.turnCount = 0;
        this.intent = {};
        this.poison = 0;

        if (this.type === 'slime') this.name = `鐵壁史萊姆 Lvl.${floor}`;
        if (this.type === 'goblin') this.name = `狂暴哥布林 Lvl.${floor}`;
        if (this.type === 'spiky') this.name = `💀 菁英：反傷刺蝟 Lvl.${floor}`;
        if (this.type === 'minotaur') this.name = `💀 菁英：牛頭猛獸 Lvl.${floor}`;

        this.setNextIntent();
    }

    setNextIntent() {
        this.turnCount++;
        let baseDmg = 5 + Math.floor(this.floor * 1.5) + this.strength;

        if (this.type === 'slime') {
            if (this.turnCount % 2 !== 0) {
                this.intent = { action: 'attack', value: baseDmg, text: `🗡️ 攻擊 ${baseDmg}` };
            } else {
                let blockAmt = 5 + (this.floor * 2);
                this.intent = { action: 'defend', value: blockAmt, text: `🛡️ 護甲 ${blockAmt}` };
            }
        } 
        else if (this.type === 'goblin') {
            if (this.turnCount % 3 === 0) {
                this.intent = { action: 'buff', value: 2, text: `🔥 力量提升 2` };
            } else {
                this.intent = { action: 'attack', value: baseDmg, text: `🗡️ 攻擊 ${baseDmg}` };
            }
        } 
        else if (this.type === 'spiky') {
            this.intent = { action: 'attack', value: Math.max(1, baseDmg - 2), text: `🗡️ 攻擊 ${Math.max(1, baseDmg - 2)} (反傷狀態)` };
        }
        else if (this.type === 'minotaur') {
            if (this.turnCount % 2 === 0) {
                let bigDmg = Math.floor(baseDmg * 1.5) + 5;
                this.intent = { action: 'attack', value: bigDmg, text: `💥 致命重擊 ${bigDmg}` };
            } else {
                this.intent = { action: 'buff', value: 2, text: `😤 蓄力中... (力量+2)` };
            }
        }
    }

    executeIntent(player) {
        this.block = 0; 
        if (this.intent.action === 'attack') {
            let actualDamage = Math.max(0, this.intent.value - player.block);
            player.block = Math.max(0, player.block - this.intent.value);
            player.hp -= actualDamage;
            logMessage(`👾 ${this.name} 攻擊！你受到 ${actualDamage} 點傷害`);
        } else if (this.intent.action === 'defend') {
            this.block += this.intent.value;
            logMessage(`👾 ${this.name} 採取防禦姿態，獲得 ${this.intent.value} 護甲`);
        } else if (this.intent.action === 'buff') {
            this.strength += this.intent.value;
            logMessage(`👾 ${this.name} 發出咆哮！攻擊力永久提升 ${this.intent.value} 點！`);
        }
        this.setNextIntent(); 
    }
}

// ================= 🛒 商店系統 =================
function enterShop() {
    logMessage(`<b>=== 第 ${floor} 層: 抵達神秘商店 ===</b>`);
    document.getElementById('shop-screen').classList.remove('hidden');
    
    // 過濾掉 isExclusive 以及 isStarter
    let regPool = CARD_POOL.filter(c => !c.isExclusive && !c.isStarter);
    shuffle(regPool);
    shopStock.regular = regPool.slice(0, 2);

    let excPool = CARD_POOL.filter(c => c.isExclusive && !c.isStarter);
    shuffle(excPool);
    shopStock.exclusive = excPool.slice(0, 2);
    
    cancelDeleteMode();
    updateShopUI();
}

function updateShopUI() {
    document.getElementById('shop-gold-display').innerText = player.gold;
    const shopCardsContainer = document.getElementById('shop-cards');
    shopCardsContainer.innerHTML = '';

    shopStock.regular.forEach((cardData, idx) => {
        if (!cardData) return;
        let cardObj = createCard(cardData.name);
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.onclick = () => buyCardFromStock('regular', idx, cardData.price);
        cardDiv.innerHTML = `
            <div class="card-header"><span>${cardObj.name}</span><div class="card-cost">${cardObj.cost}</div></div>
            <div class="card-desc">${cardObj.getDescription()}</div>
            <div style="margin-top: 10px; font-weight: bold; color: #d35400;">💰 ${cardData.price} 金幣</div>
        `;
        shopCardsContainer.appendChild(cardDiv);
    });

    shopStock.exclusive.forEach((cardData, idx) => {
        if (!cardData) return;
        let cardObj = createCard(cardData.name);
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.onclick = () => buyCardFromStock('exclusive', idx, cardData.price);
        cardDiv.innerHTML = `
            <div class="card-header"><span>${cardObj.name}</span><div class="card-cost">${cardObj.cost}</div></div>
            <div class="card-desc">${cardObj.getDescription()}</div>
            <div style="margin-top: 10px; font-weight: bold; color: #27ae60;">👑 ${cardData.price} 金幣</div>
        `;
        shopCardsContainer.appendChild(cardDiv);
    });
    
    // 動態更新升級按鈕文字
    let nextLevel = player.starterUpgradeLevel + 1;
    document.getElementById('btn-upgrade-starter').innerText = `✨ 升級專屬卡 (+${nextLevel}) (50 金幣)`;
    
    updateUI(); 
}

function buyCardFromStock(type, index, price) {
    if (player.gold >= price) {
        player.gold -= price;
        let cardData = shopStock[type][index];
        player.deck.push(createCard(cardData.name));
        alert(`✅ 購買成功！【${cardData.name}】已加入牌組。`);
        shopStock[type][index] = null;
        updateShopUI();
    } else { alert("⚠️ 金幣不足！"); }
}

function upgradeStarter() {
    if (player.gold < 50) {
        alert("⚠️ 金幣不足！需要 50 金幣。");
        return;
    }
    
    let starterIndex = player.deck.findIndex(c => c.name.startsWith("無限連鎖") || c.name.startsWith("狂暴戰吼") || c.name.startsWith("鋼鐵意志") || c.name.startsWith("劇毒配方"));
    
    if (starterIndex === -1) {
        alert("⚠️ 找不到你的專屬卡牌！（被你刪除了嗎？）");
        return;
    }
    
    player.gold -= 50;
    player.starterUpgradeLevel++; 
    
    let baseName = player.deck[starterIndex].name.split(" ")[0]; 
    player.deck[starterIndex].name = `${baseName} +${player.starterUpgradeLevel}`;
    
    alert(`✨ 升級成功！你的專屬卡進化為【${player.deck[starterIndex].name}】！`);
    updateShopUI(); 
}

function startDeleteMode() {
    if (player.gold < DELETE_COST) { alert(`⚠️ 金幣不足！需要 ${DELETE_COST} 金幣。`); return; }
    document.getElementById('shop-main-view').classList.add('hidden');
    document.getElementById('shop-delete-view').classList.remove('hidden');
    
    document.getElementById('shop-delete-title').innerHTML = `🔧 選擇要刪除的卡牌 (費用: ${DELETE_COST} | 金幣: ${player.gold}) <br><span style="font-size: 0.8em; color: #bdc3c7;">目前總牌數: ${player.deck.length} 張</span>`;
    const deckListContainer = document.getElementById('shop-deck-list');
    deckListContainer.innerHTML = '';
    
    player.deck.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.style.border = "2px solid #c0392b";
        cardDiv.onclick = () => executeDeleteCard(index);
        cardDiv.innerHTML = `
            <div class="card-header"><span>${card.name}</span><div class="card-cost">${card.cost}</div></div>
            <div class="card-desc">${card.getDescription()}</div>
        `;
        deckListContainer.appendChild(cardDiv);
    });
}

function cancelDeleteMode() {
    document.getElementById('shop-main-view').classList.remove('hidden');
    document.getElementById('shop-delete-view').classList.add('hidden');
}

function executeDeleteCard(index) {
    if (player.gold < DELETE_COST) { alert("⚠️ 金幣不足！"); return; }
    if (player.deck.length <= 1) { alert("⚠️ 牌組至少需要保留 1 張卡牌！"); return; }

    let targetCard = player.deck[index];
    if (confirm(`確定要永久刪除【${targetCard.name}】嗎？`)) {
        player.gold -= DELETE_COST;
        player.deck.splice(index, 1);
        startDeleteMode(); 
        updateShopUI();
    }
}

function buyHeal() {
    if (player.hp >= player.maxHp) { alert("⚠️ 血量已滿！"); return; }
    if (player.gold >= 20) {
        player.gold -= 20; player.hp = Math.min(player.maxHp, player.hp + 20);
        alert("💖 恢復了 20 點血量！"); updateShopUI();
    } else { alert("⚠️ 金幣不足！"); }
}

function buyMaxHp() {
    if (player.gold >= 40) {
        player.gold -= 40; player.maxHp += 5; player.hp += 5;
        alert("💪 最大血量提升了 5 點！"); updateShopUI();
    } else { alert("⚠️ 金幣不足！"); }
}

function buymaxEnergy() {
    if(player.gold >= 30) {
        player.gold -= 30; player.maxEnergy += 1; player.energy += 1;
        e+=1;
        alert("⚡ 能量上限提升了 1 點！"); updateShopUI();
    } else { alert("⚠️ 金幣不足！"); }
}

function leaveShop() {
    document.getElementById('shop-screen').classList.add('hidden');
    prepareNextBattle();
}

// ================= UI 更新 =================
function updateUI() {
    document.getElementById('floor-display').innerText = `層數: ${floor}`;
    document.getElementById('gold-display').innerText = `金幣: ${player.gold}`;
    document.getElementById('deck-count-display').innerText = `總牌數: ${player.deck.length} 張`;
    document.getElementById('energy-display').innerText = `能量: ${player.energy} / ${player.maxEnergy}`;
    document.getElementById('player-energy-status').innerText = `能量: ${player.energy} / ${player.maxEnergy}`;
    document.getElementById('player-hp').innerText = `血量: ${player.hp} / ${player.maxHp}`;
    document.getElementById('player-block').innerText = `護甲: ${player.block}`;
    document.getElementById('player-strength').innerText = `力量: ${player.strength}`;
    
    if (enemy) {
        document.getElementById('enemy-name').innerText = enemy.name;
        document.getElementById('enemy-hp').innerText = `血量: ${Math.max(0, enemy.hp)} / ${enemy.maxHp}`;
        document.getElementById('enemy-block').innerText = `護甲: ${enemy.block}`;
        document.getElementById('enemy-intent').innerText = `意圖: ${enemy.intent.text}`;
    }

    const handContainer = document.getElementById('hand-container');
    handContainer.innerHTML = '';
    player.hand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.onclick = () => playCard(index);
        cardDiv.innerHTML = `
            <div class="card-header"><span>${card.name}</span><div class="card-cost">${card.cost}</div></div>
            <div class="card-desc">${card.getDescription()}</div>
        `;
        handContainer.appendChild(cardDiv);
    });
    if (enemy) {
        document.getElementById('enemy-name').innerText = enemy.name;
        document.getElementById('enemy-hp').innerText = `血量: ${Math.max(0, enemy.hp)} / ${enemy.maxHp}`;
        document.getElementById('enemy-block').innerText = `護甲: ${enemy.block}`;
        document.getElementById('enemy-intent').innerText = `意圖: ${enemy.intent.text}`;
        
        // ✨ 動態顯示中毒 UI
        const poisonUI = document.getElementById('enemy-poison');
        if (enemy.poison > 0) {
            poisonUI.style.display = 'block';
            poisonUI.innerText = `中毒: ${enemy.poison}`;
        } else {
            poisonUI.style.display = 'none';
        }
    }
}
// ================= 📖 說明書與圖鑑系統 =================

function openManual() {
    document.getElementById('manual-modal').classList.remove('hidden');
}

function openGallery() {
    // 清空三個區塊的舊內容
    document.getElementById('gallery-starter').innerHTML = '';
    document.getElementById('gallery-exclusive').innerHTML = '';
    document.getElementById('gallery-regular').innerHTML = '';
    
    // 顯示總卡牌數
    document.getElementById('gallery-count').innerText = `(共 ${CARD_POOL.length} 張)`;

    // 讀取 CARD_POOL 並根據標籤分發到對應的區域
    CARD_POOL.forEach(data => {
        let cardObj = new Card(data);
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        let tagHtml = '';
        let targetContainerId = '';

        // 判斷分類並指定要塞入的 HTML 區塊
        if (data.isStarter) {
            tagHtml = `<div style="margin-top: 10px; font-size: 0.85em; color: #f1c40f; font-weight: bold; text-align: center; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px;">✨ 流派專屬</div>`;
            cardDiv.style.borderColor = "#f1c40f";
            targetContainerId = 'gallery-starter';
        } else if (data.isExclusive) {
            tagHtml = `<div style="margin-top: 10px; font-size: 0.85em; color: #2ecc71; font-weight: bold; text-align: center; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px;">👑 傳說限定</div>`;
            cardDiv.style.borderColor = "#2ecc71";
            targetContainerId = 'gallery-exclusive';
        } else {
            // 沒有特殊標籤的就是一般卡牌
            targetContainerId = 'gallery-regular';
        }

        cardDiv.innerHTML = `
            <div class="card-header"><span>${cardObj.name}</span><div class="card-cost">${cardObj.cost}</div></div>
            <div class="card-desc">${cardObj.getDescription()}</div>
            ${tagHtml}
        `;
        
        // 將卡牌插入對應的分類網格中
        document.getElementById(targetContainerId).appendChild(cardDiv);
    });

    document.getElementById('gallery-modal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}