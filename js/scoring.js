/**
 * 计分模块
 * 实现占先/金球、抢七等核心计分逻辑
 */

const Scoring = {
    /**
     * 记录得分
     * @param {object} match - 比赛对象
     * @param {number} player - 得分选手 (1 or 2)
     * @param {string} type - 得分类型 ('point' | 'ace')
     * @param {object} tournament - 比赛配置
     * @returns {object} 更新后的比赛对象
     */
    recordPoint(match, player, type, tournament) {
        const scoringMethod = tournament.scoringMethod || 'no-ad';
        const formatInfo = CONFIG.FORMATS[tournament.format];
        
        // 如果是抢七模式
        if (match.isTiebreak) {
            return this.recordTiebreakPointWithTournament(match, player, formatInfo, tournament);
        }
        
        // 正常局分模式
        const currentGame = match.currentGame || { player1: 0, player2: 0, serving: 1 };
        
        if (player === 1) {
            return this.updateGameScore(match, 1, currentGame, scoringMethod, formatInfo, tournament);
        } else {
            return this.updateGameScore(match, 2, currentGame, scoringMethod, formatInfo, tournament);
        }
    },
    
    /**
     * 更新局分
     * @private
     */
    updateGameScore(match, player, currentGame, scoringMethod, formatInfo, tournament) {
        const opponent = player === 1 ? 2 : 1;
        const playerScore = currentGame[`player${player}`];
        const opponentScore = currentGame[`player${opponent}`];
        
        // 检查是否40-40平分
        if (playerScore === 3 && opponentScore === 3) {
            if (scoringMethod === 'no-ad') {
                // 金球制：下一分直接获胜
                return this.finishGame(match, player, formatInfo, tournament);
            } else {
                // 占先制：需要领先2分
                match.currentGame[`player${player}`] = 'AD';
                return match;
            }
        }
        
        // 检查是否占先
        if (playerScore === 'AD') {
            // 占先方得分，获胜
            return this.finishGame(match, player, formatInfo, tournament);
        }
        
        if (opponentScore === 'AD') {
            // 对手占先，回到平分
            match.currentGame[`player${opponent}`] = 3;
            return match;
        }
        
        // 正常计分：0 -> 15 -> 30 -> 40
        match.currentGame[`player${player}`]++;
        
        // 检查是否达到获胜局数
        if (match.currentGame[`player${player}`] === formatInfo.gamesToWin) {
            return this.finishGame(match, player, formatInfo, tournament);
        }
        
        return match;
    },
    
    /**
     * 完成一局
     * @private
     */
    finishGame(match, winner, formatInfo, tournament) {
        // 确保当前盘存在
        if (!match.sets || match.sets.length === 0) {
            match.sets = [{
                games: { player1: 0, player2: 0 },
                tiebreak: null,
                pointHistory: []
            }];
        }
        
        const currentSet = match.sets[match.sets.length - 1];
        
        // 增加获胜者的局数
        if (winner === 1) {
            currentSet.games.player1++;
        } else {
            currentSet.games.player2++;
        }
        
        // 重置局分
        match.currentGame = { player1: 0, player2: 0, serving: match.currentGame.serving };
        
        // 检查是否需要抢七
        const p1Games = currentSet.games.player1;
        const p2Games = currentSet.games.player2;
        
        if (p1Games === formatInfo.tiebreakAt && p2Games === formatInfo.tiebreakAt) {
            // 进入抢七
            match.isTiebreak = true;
            match.tiebreakScore = { player1: 0, player2: 0 };
        } else {
            // 检查是否本盘结束
            const gamesToWin = formatInfo.gamesToWin;
            if (p1Games >= gamesToWin && p1Games - p2Games >= 2) {
                this.finishSet(match, 1, formatInfo, tournament);
            } else if (p2Games >= gamesToWin && p2Games - p1Games >= 2) {
                this.finishSet(match, 2, formatInfo, tournament);
            } else {
                // 切换发球方
                match.currentGame.serving = match.currentGame.serving === 1 ? 2 : 1;
            }
        }
        
        return match;
    },
    
    /**
     * 完成一盘
     * @private
     */
    finishSet(match, winner, formatInfo, tournament = null) {
        const currentSet = match.sets[match.sets.length - 1];
        
        // 保存抢七比分
        if (match.isTiebreak) {
            currentSet.tiebreak = {
                player1: match.tiebreakScore.player1,
                player2: match.tiebreakScore.player2
            };
            match.isTiebreak = false;
            match.tiebreakScore = { player1: 0, player2: 0 };
        }
        
        // 检查是否比赛结束
        const setsWon = this.calculateSetsWon(match.sets);
        if (setsWon.player1 >= formatInfo.setsToWin || setsWon.player2 >= formatInfo.setsToWin) {
            match.status = 'finished';
        } else {
            // 开始下一盘
            match.sets.push({
                games: { player1: 0, player2: 0 },
                tiebreak: null,
                pointHistory: []
            });
            match.currentGame = { player1: 0, player2: 0, serving: match.currentGame.serving === 1 ? 2 : 1 };
        }
        
        return match;
    },
    
    /**
     * 记录抢七得分
     * @private
     */
    recordTiebreakPoint(match, player, formatInfo, tournament = null) {
        if (player === 1) {
            match.tiebreakScore.player1++;
        } else {
            match.tiebreakScore.player2++;
        }
        
        const p1 = match.tiebreakScore.player1;
        const p2 = match.tiebreakScore.player2;
        
        // 检查抢七是否结束（至少7分且领先2分）
        if ((p1 >= CONFIG.TIEBREAK_RULES.pointsToWin || p2 >= CONFIG.TIEBREAK_RULES.pointsToWin) &&
            Math.abs(p1 - p2) >= CONFIG.TIEBREAK_RULES.minLead) {
            // 抢七结束，本盘结束
            const winner = p1 > p2 ? 1 : 2;
            this.finishSet(match, winner, formatInfo, tournament);
        } else {
            // 切换发球（抢七每2分换发球）
            const totalPoints = p1 + p2;
            if (totalPoints > 0 && totalPoints % 2 === 0) {
                match.currentGame.serving = match.currentGame.serving === 1 ? 2 : 1;
            }
        }
        
        return match;
    },
    
    /**
     * 记录抢七得分（带tournament参数）
     */
    recordTiebreakPointWithTournament(match, player, formatInfo, tournament) {
        return this.recordTiebreakPoint(match, player, formatInfo, tournament);
    },
    
    /**
     * 计算已获胜的盘数
     * @param {array} sets - 所有盘的数据
     * @returns {object} {player1: number, player2: number}
     */
    calculateSetsWon(sets) {
        const setsWon = { player1: 0, player2: 0 };
        
        sets.forEach(set => {
            const p1Games = set.games.player1;
            const p2Games = set.games.player2;
            
            if (p1Games > p2Games) {
                setsWon.player1++;
            } else if (p2Games > p1Games) {
                setsWon.player2++;
            } else if (set.tiebreak) {
                // 抢七决定胜负
                if (set.tiebreak.player1 > set.tiebreak.player2) {
                    setsWon.player1++;
                } else {
                    setsWon.player2++;
                }
            }
        });
        
        return setsWon;
    },
    
    /**
     * 撤销上一步操作
     * @param {object} match - 比赛对象
     * @param {array} pointHistory - 得分历史
     * @returns {object} 更新后的比赛对象
     */
    undoLastPoint(match, pointHistory) {
        if (!pointHistory || pointHistory.length === 0) {
            return match;
        }
        
        // 这里需要实现撤销逻辑
        // 由于计分逻辑复杂，建议保存完整的状态快照
        const lastState = pointHistory[pointHistory.length - 1].previousState;
        if (lastState) {
            return lastState;
        }
        
        return match;
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scoring;
}

