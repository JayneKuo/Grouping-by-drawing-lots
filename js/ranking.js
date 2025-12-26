/**
 * 排名模块
 * 实现平分出线的多维度排序算法
 * 排序优先级：积分 → 局数差 → 直胜 → ACE数 → 净胜分 → 人工裁定
 */

const Ranking = {
    /**
     * 计算积分榜
     * @param {array} matches - 所有比赛
     * @param {array} players - 所有选手
     * @param {string} groupId - 组ID
     * @returns {array} 积分榜数组
     */
    calculateStandings(matches, players, groupId) {
        const groupMatches = matches.filter(m => m.groupId === groupId && m.status === 'finished');
        const standings = {};
        
        // 初始化积分榜
        players.forEach(player => {
            standings[player.id] = {
                playerId: player.id,
                playerName: player.name,
                matches: 0,
                wins: 0,
                losses: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
                aces: player.stats?.aces || 0,
                faults: player.stats?.faults || 0,
                points: 0,
                tiebreakCriteria: {
                    gamesDiff: 0,
                    headToHead: null,
                    acesDiff: 0,
                    pointsDiff: 0
                }
            };
        });
        
        // 计算每场比赛的统计
        groupMatches.forEach(match => {
            this.updateStandingsFromMatch(standings, match, players);
        });
        
        // 计算平分出线排序依据
        Object.values(standings).forEach(standing => {
            standing.tiebreakCriteria.gamesDiff = standing.gamesWon - standing.gamesLost;
            standing.tiebreakCriteria.acesDiff = standing.aces;
            // pointsDiff 需要从比赛数据中计算
        });
        
        // 计算直胜关系
        this.calculateHeadToHead(standings, groupMatches);
        
        // 转换为数组并排序
        return this.sortStandings(Object.values(standings));
    },
    
    /**
     * 从比赛更新积分榜
     * @private
     */
    updateStandingsFromMatch(standings, match, players) {
        const player1Id = match.player1Id;
        const player2Id = match.player2Id;
        
        if (!standings[player1Id] || !standings[player2Id]) return;
        
        const p1Standing = standings[player1Id];
        const p2Standing = standings[player2Id];
        
        // 增加比赛场次
        p1Standing.matches++;
        p2Standing.matches++;
        
        // 计算盘数和局数
        let p1SetsWon = 0;
        let p2SetsWon = 0;
        let p1GamesWon = 0;
        let p2GamesWon = 0;
        
        match.sets.forEach(set => {
            const setWinner = this.getSetWinner(set);
            if (setWinner === 1) {
                p1SetsWon++;
            } else if (setWinner === 2) {
                p2SetsWon++;
            }
            
            p1GamesWon += set.games.player1;
            p2GamesWon += set.games.player2;
        });
        
        // 更新胜负
        if (p1SetsWon > p2SetsWon) {
            p1Standing.wins++;
            p2Standing.losses++;
            p1Standing.points += 2;
        } else {
            p2Standing.wins++;
            p1Standing.losses++;
            p2Standing.points += 2;
        }
        
        // 更新盘数和局数
        p1Standing.setsWon += p1SetsWon;
        p1Standing.setsLost += p2SetsWon;
        p2Standing.setsWon += p2SetsWon;
        p2Standing.setsLost += p1SetsWon;
        
        p1Standing.gamesWon += p1GamesWon;
        p1Standing.gamesLost += p2GamesWon;
        p2Standing.gamesWon += p2GamesWon;
        p2Standing.gamesLost += p1GamesWon;
        
        // 更新ACE和失误统计（需要从pointHistory中统计）
        // 这里简化处理，实际应从match.pointHistory中统计
    },
    
    /**
     * 获取一盘比赛的胜者
     * @private
     */
    getSetWinner(set) {
        const p1Games = set.games.player1;
        const p2Games = set.games.player2;
        
        if (p1Games > p2Games) return 1;
        if (p2Games > p1Games) return 2;
        
        // 如果平局，看抢七
        if (set.tiebreak) {
            if (set.tiebreak.player1 > set.tiebreak.player2) return 1;
            if (set.tiebreak.player2 > set.tiebreak.player1) return 2;
        }
        
        return null;
    },
    
    /**
     * 计算直胜关系
     * @private
     */
    calculateHeadToHead(standings, matches) {
        const playerIds = Object.keys(standings);
        
        // 对每对选手计算直胜关系
        for (let i = 0; i < playerIds.length; i++) {
            for (let j = i + 1; j < playerIds.length; j++) {
                const player1Id = playerIds[i];
                const player2Id = playerIds[j];
                
                // 查找两人之间的直接对战
                const headToHeadMatch = matches.find(m => 
                    (m.player1Id === player1Id && m.player2Id === player2Id) ||
                    (m.player1Id === player2Id && m.player2Id === player1Id)
                );
                
                if (headToHeadMatch && headToHeadMatch.status === 'finished') {
                    const winner = this.getMatchWinner(headToHeadMatch, player1Id);
                    if (winner === player1Id) {
                        standings[player1Id].tiebreakCriteria.headToHead = 'win';
                        standings[player2Id].tiebreakCriteria.headToHead = 'loss';
                    } else if (winner === player2Id) {
                        standings[player1Id].tiebreakCriteria.headToHead = 'loss';
                        standings[player2Id].tiebreakCriteria.headToHead = 'win';
                    }
                }
            }
        }
    },
    
    /**
     * 获取比赛胜者
     * @private
     */
    getMatchWinner(match, player1Id) {
        const setsWon = { player1: 0, player2: 0 };
        
        match.sets.forEach(set => {
            const winner = this.getSetWinner(set);
            if (match.player1Id === player1Id) {
                if (winner === 1) setsWon.player1++;
                if (winner === 2) setsWon.player2++;
            } else {
                if (winner === 1) setsWon.player2++;
                if (winner === 2) setsWon.player1++;
            }
        });
        
        if (setsWon.player1 > setsWon.player2) return player1Id;
        if (setsWon.player2 > setsWon.player1) return match.player2Id;
        return null;
    },
    
    /**
     * 排序积分榜
     * 优先级：积分 → 局数差 → 直胜 → ACE数 → 净胜分
     * @param {array} standings - 积分榜数组
     * @returns {array} 排序后的积分榜
     */
    sortStandings(standings) {
        return standings.sort((a, b) => {
            // 1. 积分
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            
            // 2. 局数差
            const gamesDiffA = a.tiebreakCriteria.gamesDiff;
            const gamesDiffB = b.tiebreakCriteria.gamesDiff;
            if (gamesDiffB !== gamesDiffA) {
                return gamesDiffB - gamesDiffA;
            }
            
            // 3. 直胜关系
            const headToHead = this.compareHeadToHead(a, b);
            if (headToHead !== 0) {
                return headToHead;
            }
            
            // 4. ACE数差
            const acesDiffA = a.tiebreakCriteria.acesDiff;
            const acesDiffB = b.tiebreakCriteria.acesDiff;
            if (acesDiffB !== acesDiffA) {
                return acesDiffB - acesDiffA;
            }
            
            // 5. 净胜分（这里简化处理，实际应从比赛数据计算）
            const pointsDiffA = a.tiebreakCriteria.pointsDiff;
            const pointsDiffB = b.tiebreakCriteria.pointsDiff;
            if (pointsDiffB !== pointsDiffA) {
                return pointsDiffB - pointsDiffA;
            }
            
            // 6. 人工裁定（如果有）
            // 这里可以添加人工排序标记
            
            return 0;
        });
    },
    
    /**
     * 比较直胜关系
     * @private
     */
    compareHeadToHead(a, b) {
        if (a.tiebreakCriteria.headToHead === 'win' && b.tiebreakCriteria.headToHead === 'loss') {
            return -1;
        }
        if (a.tiebreakCriteria.headToHead === 'loss' && b.tiebreakCriteria.headToHead === 'win') {
            return 1;
        }
        return 0;
    },
    
    /**
     * 获取出线选手
     * @param {array} standings - 排序后的积分榜
     * @param {number} quota - 出线名额
     * @returns {array} 出线选手ID数组
     */
    getQualifiers(standings, quota = 2) {
        return standings.slice(0, quota).map(s => s.playerId);
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Ranking;
}

