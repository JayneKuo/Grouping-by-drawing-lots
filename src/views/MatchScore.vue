<template>
  <div class="match-score">
    <van-nav-bar title="比赛详情" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="edit" size="20" @click="handleEditMatch" />
      </template>
    </van-nav-bar>
    
    <div class="content" v-if="match">
      <!-- 比赛标题 -->
      <div class="match-title-section">
        <div class="match-title">{{ match.player1_name }} VS {{ match.player2_name }}</div>
        <div class="match-info">{{ getMatchInfo() }}</div>
      </div>
      
      <!-- 比赛结果展示区域 -->
      <div class="match-result-area">
        <!-- 选手1 -->
        <div class="player-section player-left">
          <van-icon v-if="match.winner === 'player1'" name="star" color="#3b82f6" size="18" class="star-icon-left" />
          <div 
            class="player-avatar clickable-avatar" 
            :class="{ 'disabled': match.status === 'finished' }"
            @click="match.status !== 'finished' && recordPoint(0)"
          >
            <span class="avatar-text">{{ getPlayerInitial(match.player1_name) }}</span>
          </div>
          <div class="player-ranking">{{ getPlayerRanking(match.player1_id) }}</div>
          <div class="player-name">{{ match.player1_name }}</div>
        </div>
        
        <!-- 中间比分区域 -->
        <div class="score-center">
          <div class="match-status-badge">{{ getMatchStatusText() }}</div>
          <div class="match-score-large">
            <span class="score-number">{{ getPlayer1SetsWon() }}</span>
            <span class="score-separator">-</span>
            <span class="score-number">{{ getPlayer2SetsWon() }}</span>
          </div>
          <div v-if="currentSet && !currentSet.isTiebreak" class="match-score-current">
            <span class="current-games">{{ currentSet.player1Games || 0 }}</span>
            <span class="score-separator">-</span>
            <span class="current-games">{{ currentSet.player2Games || 0 }}</span>
          </div>
          <div v-if="currentSet && currentSet.isTiebreak" class="match-score-tiebreak">
            抢七: {{ currentSet.tiebreakScore?.player1 || 0 }}-{{ currentSet.tiebreakScore?.player2 || 0 }}
          </div>
          <div class="match-date-small">{{ formatMatchDateShort() }}</div>
        </div>
        
        <!-- 选手2 -->
        <div class="player-section player-right">
          <van-icon v-if="match.winner === 'player2'" name="star" color="#3b82f6" size="18" class="star-icon-right" />
          <div 
            class="player-avatar clickable-avatar" 
            :class="{ 'disabled': match.status === 'finished' }"
            @click="match.status !== 'finished' && recordPoint(1)"
          >
            <span class="avatar-text">{{ getPlayerInitial(match.player2_name) }}</span>
          </div>
          <div class="player-ranking">{{ getPlayerRanking(match.player2_id) }}</div>
          <div class="player-name">{{ match.player2_name }}</div>
        </div>
      </div>
      
      <!-- 导航栏 -->
      <div class="match-nav-tabs">
        <div 
          class="nav-tab" 
          :class="{ 'active': activeTab === 'match' }"
          @click="activeTab = 'match'"
        >
          比赛
        </div>
        <div 
          class="nav-tab" 
          :class="{ 'active': activeTab === 'statistics' }"
          @click="activeTab = 'statistics'"
        >
          资料统计
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="match-content">
        <!-- 比赛详情 - 比分 -->
        <div v-if="activeTab === 'match'" class="tab-content">
          <div class="scoreboard-container">
            <div class="scoreboard-title-bar">
              <div class="scoreboard-title">比分</div>
              <van-button 
                type="primary" 
                size="small" 
                icon="tv-o"
                @click="showScoreboardFullscreen"
                class="fullscreen-btn"
              >
                投屏
              </van-button>
            </div>
            
            <!-- 数字计分板风格 -->
            <div class="digital-scoreboard" ref="scoreboardRef">
              <!-- 表头 -->
              <div class="scoreboard-header">
                <div class="header-player">选手</div>
                <div class="header-sets">SETS</div>
                <div class="header-games">GAMES</div>
                <div class="header-points">POINTS</div>
              </div>
              
              <!-- 选手1行 -->
              <div class="scoreboard-row" :class="{ 'serving': getCurrentServer() === 0 && currentSet && !currentSet.isTiebreak }">
                <div class="row-player">
                  <span v-if="getCurrentServer() === 0 && currentSet && !currentSet.isTiebreak" class="serve-indicator">●</span>
                  <span class="player-name">{{ match.player1_name.toUpperCase() }}</span>
                </div>
                <div class="row-sets">{{ getPlayer1SetsWon() }}</div>
                <div class="row-games">
                  <span v-if="currentSet && !currentSet.isTiebreak">
                    {{ currentSet.player1Games || 0 }}
                  </span>
                  <span v-else-if="currentSet && currentSet.isTiebreak">TB</span>
                  <span v-else>-</span>
                </div>
                <div class="row-points">
                  <span v-if="currentSet && !currentSet.isTiebreak">
                    {{ formatPointDisplay(currentSet.player1Points || 0) }}
                  </span>
                  <span v-else-if="currentSet && currentSet.isTiebreak">
                    {{ currentSet.tiebreakScore?.player1 || 0 }}
                  </span>
                  <span v-else>0</span>
                </div>
              </div>
              
              <!-- 选手2行 -->
              <div class="scoreboard-row" :class="{ 'serving': getCurrentServer() === 1 && currentSet && !currentSet.isTiebreak }">
                <div class="row-player">
                  <span v-if="getCurrentServer() === 1 && currentSet && !currentSet.isTiebreak" class="serve-indicator">●</span>
                  <span class="player-name">{{ match.player2_name.toUpperCase() }}</span>
                </div>
                <div class="row-sets">{{ getPlayer2SetsWon() }}</div>
                <div class="row-games">
                  <span v-if="currentSet && !currentSet.isTiebreak">
                    {{ currentSet.player2Games || 0 }}
                  </span>
                  <span v-else-if="currentSet && currentSet.isTiebreak">TB</span>
                  <span v-else>-</span>
                </div>
                <div class="row-points">
                  <span v-if="currentSet && !currentSet.isTiebreak">
                    {{ formatPointDisplay(currentSet.player2Points || 0) }}
                  </span>
                  <span v-else-if="currentSet && currentSet.isTiebreak">
                    {{ currentSet.tiebreakScore?.player2 || 0 }}
                  </span>
                  <span v-else>0</span>
                </div>
              </div>
              
            </div>
            
            <!-- 历史盘分详情 -->
            <div v-if="completedSets && completedSets.length > 0" class="sets-history">
              <div class="history-title">各盘比分</div>
              <div class="sets-grid">
                <div 
                  v-for="(set, index) in completedSets" 
                  :key="index"
                  class="set-item"
                  :class="{ 'winner-set': set.winner === 'player1' || set.winner === 'player2' }"
                >
                  <div class="set-number">第{{ index + 1 }}盘</div>
                  <div class="set-score">
                    {{ set.player1Games }} - {{ set.player2Games }}
                    <span v-if="set.isTiebreak" class="tiebreak-badge">抢七</span>
                  </div>
                  <div class="set-winner">
                    {{ set.winner === 'player1' ? match.player1_name : set.winner === 'player2' ? match.player2_name : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 资料统计 -->
        <div v-if="activeTab === 'statistics'" class="tab-content">
          <!-- 子导航栏 -->
          <div class="statistics-sub-nav">
            <div 
              class="sub-nav-item" 
              :class="{ 'active': selectedStatisticsSet === -1 }"
              @click="selectedStatisticsSet = -1"
            >
              比赛
            </div>
            <div 
              v-for="(set, index) in completedSets" 
              :key="index"
              class="sub-nav-item"
              :class="{ 'active': selectedStatisticsSet === index }"
              @click="selectedStatisticsSet = index"
            >
              第{{ index + 1 }}盘
            </div>
            <div 
              v-if="hasCurrentSet()"
              class="sub-nav-item"
              :class="{ 'active': selectedStatisticsSet === completedSets.length }"
              @click="selectedStatisticsSet = completedSets.length"
            >
              当前盘
            </div>
          </div>
          
          <!-- 统计表格 -->
          <div class="statistics-table-container">
            <div class="statistics-table">
              <!-- 发球统计 -->
              <div class="stat-category">
                <div class="category-header">发球</div>
                
                <!-- Ace球 -->
                <div class="stat-row">
                  <div class="stat-value-left">{{ getAceCount('player1', selectedStatisticsSet) }}</div>
                  <div class="stat-label-center">Ace球</div>
                  <div class="stat-value-right highlight">{{ getAceCount('player2', selectedStatisticsSet) }}</div>
                </div>
                
                <!-- 双发失误 -->
                <div class="stat-row">
                  <div class="stat-value-left">{{ getDoubleFaultCount('player1', selectedStatisticsSet) }}</div>
                  <div class="stat-label-center">双发失误</div>
                  <div class="stat-value-right highlight">{{ getDoubleFaultCount('player2', selectedStatisticsSet) }}</div>
                </div>
                
                <!-- 一发得分点 -->
                <div class="stat-row">
                  <div class="stat-value-left">{{ getFirstServePointsWon('player1', selectedStatisticsSet) }}</div>
                  <div class="stat-label-center">一发得分点</div>
                  <div class="stat-value-right highlight">{{ getFirstServePointsWon('player2', selectedStatisticsSet) }}</div>
                </div>
                
                <!-- 一发得分率 -->
                <div class="stat-row">
                  <div class="stat-value-left">{{ getFirstServeWinRate('player1', selectedStatisticsSet) }}</div>
                  <div class="stat-label-center">一发得分率</div>
                  <div class="stat-value-right highlight">{{ getFirstServeWinRate('player2', selectedStatisticsSet) }}</div>
                </div>
                
                <!-- 二发得分率 -->
                <div class="stat-row">
                  <div class="stat-value-left">{{ getSecondServeWinRate('player1', selectedStatisticsSet) }}</div>
                  <div class="stat-label-center">二发得分率</div>
                  <div class="stat-value-right highlight">{{ getSecondServeWinRate('player2', selectedStatisticsSet) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 设置发球方弹窗 -->
      <van-dialog
        v-model:show="showServerDialog"
        title="设置发球方"
        show-cancel-button
        @confirm="confirmServer"
        @cancel="showServerDialog = false"
      >
        <div style="padding: 20px;" v-if="match">
          <van-radio-group v-model="selectedServer">
            <van-radio name="0">{{ match.player1_name || '选手1' }}</van-radio>
            <van-radio name="1" style="margin-top: 16px;">{{ match.player2_name || '选手2' }}</van-radio>
          </van-radio-group>
        </div>
        <div v-else style="padding: 20px; text-align: center;">
          加载中...
        </div>
      </van-dialog>
      
      <!-- OUT选择弹窗 -->
      <van-dialog
        v-model:show="showOutDialog"
        title="选择OUT方"
        show-cancel-button
        @confirm="confirmOut"
        @cancel="showOutDialog = false"
      >
        <div style="padding: 20px;">
          <van-radio-group v-model="selectedOutPlayer">
            <van-radio name="0">{{ match.player1_name }} OUT</van-radio>
            <van-radio name="1" style="margin-top: 16px;">{{ match.player2_name }} OUT</van-radio>
          </van-radio-group>
        </div>
      </van-dialog>
      
      <!-- 编辑比赛信息弹窗 -->
      <van-popup 
        v-model:show="showEditMatchDialog" 
        position="bottom"
        :style="{ padding: '20px' }"
      >
        <van-form @submit="saveMatchEdit">
          <van-cell-group inset>
            <van-cell title="编辑比赛信息" />
            <van-field
              v-model="matchEditForm.start_date"
              name="start_date"
              label="比赛日期"
              placeholder="选择日期"
              is-link
              readonly
              @click="showDatePicker = true"
            />
            <van-field
              v-model="matchEditForm.start_time"
              name="start_time"
              label="比赛时间"
              placeholder="选择时间"
              is-link
              readonly
              @click="showTimePicker = true"
            />
            <van-field
              v-model="matchEditForm.location"
              name="location"
              label="比赛地点"
              placeholder="请输入比赛地点"
            />
          </van-cell-group>
          <div style="margin-top: 16px; padding: 0 16px;">
            <van-button round block type="primary" native-type="submit">
              保存
            </van-button>
            <van-button round block style="margin-top: 12px;" @click="showEditMatchDialog = false">
              取消
            </van-button>
          </div>
        </van-form>
      </van-popup>
      
      <!-- 日期选择器 -->
      <van-popup v-model:show="showDatePicker" position="bottom">
        <van-date-picker
          v-model="datePickerValue"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>
      
      <!-- 时间选择器 -->
      <van-popup v-model:show="showTimePicker" position="bottom">
        <van-time-picker
          v-model="timePickerValue"
          @confirm="onTimeConfirm"
          @cancel="showTimePicker = false"
        />
      </van-popup>
      
      <!-- 全屏投屏（横屏展示整个页面） -->
      <van-popup 
        v-model:show="showFullscreenScoreboard" 
        position="center"
        :style="{ width: '95vw', height: '95vh', maxWidth: 'none', padding: '0' }"
        :close-on-click-overlay="true"
        class="fullscreen-scoreboard-popup landscape"
      >
        <div class="fullscreen-page-container">
          <!-- 全屏页面头部 -->
          <div class="fullscreen-page-header">
            <div class="fullscreen-title">{{ match?.player1_name }} VS {{ match?.player2_name }}</div>
            <van-icon name="cross" class="close-icon" @click="closeFullscreenScoreboard" />
          </div>
          
          <!-- 全屏页面导航 -->
          <div class="fullscreen-nav-tabs">
            <div 
              class="fullscreen-nav-tab" 
              :class="{ 'active': activeTab === 'match' }"
              @click="activeTab = 'match'"
            >
              比赛
            </div>
            <div 
              class="fullscreen-nav-tab" 
              :class="{ 'active': activeTab === 'statistics' }"
              @click="activeTab = 'statistics'"
            >
              资料统计
            </div>
          </div>
          
           <!-- 全屏页面内容 -->
           <div class="fullscreen-page-content">
             <!-- 比赛详情 - 比分 -->
             <div v-if="activeTab === 'match'" class="fullscreen-tab-content">
               <div class="digital-scoreboard fullscreen-version rotated-scoreboard">
                <!-- 表头 -->
                <div class="scoreboard-header">
                  <div class="header-player">选手</div>
                  <div class="header-sets">SETS</div>
                  <div class="header-games">GAMES</div>
                  <div class="header-points">POINTS</div>
                </div>
                
                <!-- 选手1行 -->
                <div class="scoreboard-row" :class="{ 'serving': getCurrentServer() === 0 && currentSet && !currentSet.isTiebreak }">
                  <div class="row-player">
                    <span v-if="getCurrentServer() === 0 && currentSet && !currentSet.isTiebreak" class="serve-indicator">●</span>
                    <span class="player-name">{{ match?.player1_name?.toUpperCase() }}</span>
                  </div>
                  <div class="row-sets">{{ getPlayer1SetsWon() }}</div>
                  <div class="row-games">
                    <span v-if="currentSet && !currentSet.isTiebreak">
                      {{ currentSet.player1Games || 0 }}
                    </span>
                    <span v-else-if="currentSet && currentSet.isTiebreak">TB</span>
                    <span v-else>-</span>
                  </div>
                  <div class="row-points">
                    <span v-if="currentSet && !currentSet.isTiebreak">
                      {{ formatPointDisplay(currentSet.player1Points || 0) }}
                    </span>
                    <span v-else-if="currentSet && currentSet.isTiebreak">
                      {{ currentSet.tiebreakScore?.player1 || 0 }}
                    </span>
                    <span v-else>0</span>
                  </div>
                </div>
                
                <!-- 选手2行 -->
                <div class="scoreboard-row" :class="{ 'serving': getCurrentServer() === 1 && currentSet && !currentSet.isTiebreak }">
                  <div class="row-player">
                    <span v-if="getCurrentServer() === 1 && currentSet && !currentSet.isTiebreak" class="serve-indicator">●</span>
                    <span class="player-name">{{ match?.player2_name?.toUpperCase() }}</span>
                  </div>
                  <div class="row-sets">{{ getPlayer2SetsWon() }}</div>
                  <div class="row-games">
                    <span v-if="currentSet && !currentSet.isTiebreak">
                      {{ currentSet.player2Games || 0 }}
                    </span>
                    <span v-else-if="currentSet && currentSet.isTiebreak">TB</span>
                    <span v-else>-</span>
                  </div>
                  <div class="row-points">
                    <span v-if="currentSet && !currentSet.isTiebreak">
                      {{ formatPointDisplay(currentSet.player2Points || 0) }}
                    </span>
                    <span v-else-if="currentSet && currentSet.isTiebreak">
                      {{ currentSet.tiebreakScore?.player2 || 0 }}
                    </span>
                    <span v-else>0</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 资料统计 -->
            <div v-if="activeTab === 'statistics'" class="fullscreen-tab-content">
              <!-- 子导航栏 -->
              <div class="statistics-sub-nav">
                <div 
                  class="sub-nav-item" 
                  :class="{ 'active': selectedStatisticsSet === -1 }"
                  @click="selectedStatisticsSet = -1"
                >
                  比赛
                </div>
                <div 
                  v-for="(set, index) in completedSets" 
                  :key="index"
                  class="sub-nav-item"
                  :class="{ 'active': selectedStatisticsSet === index }"
                  @click="selectedStatisticsSet = index"
                >
                  第{{ index + 1 }}盘
                </div>
                <div 
                  v-if="hasCurrentSet()"
                  class="sub-nav-item"
                  :class="{ 'active': selectedStatisticsSet === completedSets.length }"
                  @click="selectedStatisticsSet = completedSets.length"
                >
                  当前盘
                </div>
              </div>
              
              <!-- 统计表格 -->
              <div class="statistics-table-container">
                <div class="statistics-table">
                  <!-- 发球统计 -->
                  <div class="stat-category">
                    <div class="category-header">发球</div>
                    
                    <!-- Ace球 -->
                    <div class="stat-row">
                      <div class="stat-value-left">{{ getAceCount('player1', selectedStatisticsSet) }}</div>
                      <div class="stat-label-center">Ace球</div>
                      <div class="stat-value-right highlight">{{ getAceCount('player2', selectedStatisticsSet) }}</div>
                    </div>
                    
                    <!-- 双发失误 -->
                    <div class="stat-row">
                      <div class="stat-value-left">{{ getDoubleFaultCount('player1', selectedStatisticsSet) }}</div>
                      <div class="stat-label-center">双发失误</div>
                      <div class="stat-value-right highlight">{{ getDoubleFaultCount('player2', selectedStatisticsSet) }}</div>
                    </div>
                    
                    <!-- 一发得分点 -->
                    <div class="stat-row">
                      <div class="stat-value-left">{{ getFirstServePointsWon('player1', selectedStatisticsSet) }}</div>
                      <div class="stat-label-center">一发得分点</div>
                      <div class="stat-value-right highlight">{{ getFirstServePointsWon('player2', selectedStatisticsSet) }}</div>
                    </div>
                    
                    <!-- 一发得分率 -->
                    <div class="stat-row">
                      <div class="stat-value-left">{{ getFirstServeWinRate('player1', selectedStatisticsSet) }}</div>
                      <div class="stat-label-center">一发得分率</div>
                      <div class="stat-value-right highlight">{{ getFirstServeWinRate('player2', selectedStatisticsSet) }}</div>
                    </div>
                    
                    <!-- 二发得分率 -->
                    <div class="stat-row">
                      <div class="stat-value-left">{{ getSecondServeWinRate('player1', selectedStatisticsSet) }}</div>
                      <div class="stat-label-center">二发得分率</div>
                      <div class="stat-value-right highlight">{{ getSecondServeWinRate('player2', selectedStatisticsSet) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-popup>
      
      <!-- 保存按钮（吸底） -->
      <div class="save-button-fixed">
        <van-button 
          type="success" 
          size="large" 
          block 
          round
          @click="saveScore"
          :loading="saving"
          :disabled="match.status === 'finished'"
        >
          保存比分
        </van-button>
      </div>
      
      <!-- 选手操作按钮组（每个选手独立） -->
      <div class="player-actions">
        <!-- 选手1操作区 -->
        <div class="player-action-group player1-group">
          <div class="player-action-title">{{ match.player1_name }}</div>
          <div class="player-action-buttons">
            <div 
              class="action-btn btn-score" 
              :class="{ 'disabled': match.status === 'finished' }"
              @click="recordPoint(0)"
            >
              <van-icon name="medal-o" />
              <span>得分</span>
            </div>
            <div 
              class="action-btn btn-ace" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(0),
                'not-server': !isPlayerServer(0)
              }"
              @click="recordAceForPlayer(0)"
            >
              <van-icon name="star-o" />
              <span>ACE</span>
            </div>
            <div 
              class="action-btn btn-double-fault" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(0),
                'not-server': !isPlayerServer(0)
              }"
              @click="recordDoubleFaultForPlayer(0)"
            >
              <van-icon name="cross" />
              <span>双误</span>
            </div>
            <div 
              class="action-btn btn-first-fault" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(0),
                'not-server': !isPlayerServer(0)
              }"
              @click="recordFirstServeFault(0)"
            >
              <van-icon name="close" />
              <span>一发失误</span>
            </div>
            <div 
              class="action-btn btn-serve-out" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(0),
                'not-server': !isPlayerServer(0)
              }"
              @click="recordServeOut(0)"
            >
              <van-icon name="close" />
              <span>发球出界</span>
            </div>
            <div 
              class="action-btn btn-return-out" 
              :class="{ 'disabled': match.status === 'finished' }"
              @click="recordReturnOut(0)"
            >
              <van-icon name="close" />
              <span>回球出界</span>
            </div>
            <div 
              class="action-btn btn-golden-point" 
              :class="{ 
                'disabled': match.status === 'finished' || !isDeuce(),
                'not-available': !isDeuce()
              }"
              @click="setGoldenPointForCurrentGame(true)"
            >
              <van-icon name="medal" />
              <span>金球</span>
            </div>
          </div>
        </div>
        
        <!-- 选手2操作区 -->
        <div class="player-action-group player2-group">
          <div class="player-action-title">{{ match.player2_name }}</div>
          <div class="player-action-buttons">
            <div 
              class="action-btn btn-score" 
              :class="{ 'disabled': match.status === 'finished' }"
              @click="recordPoint(1)"
            >
              <van-icon name="medal-o" />
              <span>得分</span>
            </div>
            <div 
              class="action-btn btn-ace" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(1),
                'not-server': !isPlayerServer(1)
              }"
              @click="recordAceForPlayer(1)"
            >
              <van-icon name="star-o" />
              <span>ACE</span>
            </div>
            <div 
              class="action-btn btn-double-fault" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(1),
                'not-server': !isPlayerServer(1)
              }"
              @click="recordDoubleFaultForPlayer(1)"
            >
              <van-icon name="cross" />
              <span>双误</span>
            </div>
            <div 
              class="action-btn btn-first-fault" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(1),
                'not-server': !isPlayerServer(1)
              }"
              @click="recordFirstServeFault(1)"
            >
              <van-icon name="close" />
              <span>一发失误</span>
            </div>
            <div 
              class="action-btn btn-serve-out" 
              :class="{ 
                'disabled': match.status === 'finished' || !isPlayerServer(1),
                'not-server': !isPlayerServer(1)
              }"
              @click="recordServeOut(1)"
            >
              <van-icon name="close" />
              <span>发球出界</span>
            </div>
            <div 
              class="action-btn btn-return-out" 
              :class="{ 'disabled': match.status === 'finished' }"
              @click="recordReturnOut(1)"
            >
              <van-icon name="close" />
              <span>回球出界</span>
            </div>
            <div 
              class="action-btn btn-golden-point" 
              :class="{ 
                'disabled': match.status === 'finished' || !isDeuce(),
                'not-available': !isDeuce()
              }"
              @click="setGoldenPointForCurrentGame(true)"
            >
              <van-icon name="medal" />
              <span>金球</span>
            </div>
          </div>
        </div>
        
        <!-- 通用操作 -->
        <div class="common-actions">
          <div 
            class="action-btn btn-undo" 
            :class="{ 'disabled': match.status === 'finished' }"
            @click="undoLast"
          >
            <van-icon name="revoke" />
            <span>撤销</span>
          </div>
        </div>
      </div>
    </div>
    
    <van-loading v-else type="spinner" vertical>加载中...</van-loading>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { recordPoint as recordPointUtil, getScoreText, recordFirstServeFault as recordFirstServeFaultUtil, recordDoubleFault as recordDoubleFaultUtil, setGoldenPoint as setGoldenPointUtil } from '../utils/scoring'
import { storage } from '../utils/storage'

const route = useRoute()
const match = ref(null)
const saving = ref(false)
const lastAction = ref(null)
const showServerDialog = ref(false)
const selectedServer = ref('0')
const showOutDialog = ref(false)
const selectedOutPlayer = ref('0')
const expandedSets = ref(new Set())
const activeTab = ref('match')
const selectedSetIndex = ref(0) // 用于逐球比分和统计的盘次选择
const selectedStatisticsSet = ref(-1) // 用于资料统计的盘次选择：-1=比赛，0+=第几盘
const tournamentInfo = ref(null)
const showEditMatchDialog = ref(false)
const showDatePicker = ref(false)
const showTimePicker = ref(false)
const matchEditForm = ref({
  start_date: '',
  start_time: '',
  location: ''
})
const datePickerValue = ref(['2025', '01', '01'])
const timePickerValue = ref(['14', '00'])
const editingMatch = ref(null)
const scoreboardRef = ref(null)
const showFullscreenScoreboard = ref(false)

const currentSet = computed(() => {
  return match.value?.currentSet
})

const completedSets = computed(() => {
  return match.value?.sets || []
})

function getPlayer1Score() {
  if (!match.value || !match.value.sets) return '0'
  const wonSets = match.value.sets.filter(s => s.winner === 'player1').length
  return `${wonSets}盘`
}

function getPlayer2Score() {
  if (!match.value || !match.value.sets) return '0'
  const wonSets = match.value.sets.filter(s => s.winner === 'player2').length
  return `${wonSets}盘`
}

function getCurrentScore() {
  if (!match.value) return '0-0'
  return getScoreText(match.value)
}

function getMatchStatusText() {
  const map = {
    'pending': '未开始',
    'in-progress': '进行中',
    'finished': '已结束'
  }
  return map[match.value?.status] || match.value?.status || '未知'
}

function getGameScore() {
  if (!currentSet.value) return '0-0'
  const pointMap = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }
  const p1 = pointMap[currentSet.value.player1Points] || currentSet.value.player1Points
  const p2 = pointMap[currentSet.value.player2Points] || currentSet.value.player2Points
  return `${p1}-${p2}`
}

function getCurrentGameNumber() {
  if (!match.value || !currentSet.value) return 1
  // 当前盘已完成的局数 + 1
  return (currentSet.value.player1Games + currentSet.value.player2Games) + 1
}

function getCurrentServer() {
  // 返回当前发球方：0=player1, 1=player2
  if (!match.value || !match.value.currentSet) return 0
  return match.value.currentSet.currentServer || 0
}

function isPlayerServer(playerIndex) {
  // 判断指定选手是否是当前发球方
  return getCurrentServer() === playerIndex
}

function getScoringMethod() {
  // 获取计分方式：'ad' 或 'no-ad'
  if (!match.value || !tournamentInfo.value) return 'no-ad'
  return tournamentInfo.value.scoring_method || match.value.scoring_method || 'no-ad'
}

// 获取当前局分显示（不显示0-0，显示实际局数）
function getCurrentGameScore(playerIndex) {
  if (!currentSet.value) return '-'
  const p1Games = currentSet.value.player1Games || 0
  const p2Games = currentSet.value.player2Games || 0
  
  // 如果都是0，不显示
  if (p1Games === 0 && p2Games === 0) {
    return '-'
  }
  
  // 显示局数
  if (playerIndex === 0) {
    return `${p1Games}-${p2Games}`
  } else {
    return `${p2Games}-${p1Games}`
  }
}

// 格式化单个选手的分数显示（数字计分板风格）
function formatPointDisplay(points) {
  if (points === 0) return '0'
  const pointMap = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'Ad' }
  return pointMap[Math.min(points, 3)] || points
}

// 格式化当前分（球分）显示，使用15-30这样的格式
function formatGamePointScore(p1Points, p2Points) {
  // 如果都是0，不显示0-0
  if (p1Points === 0 && p2Points === 0) {
    return '-'
  }
  
  const method = getScoringMethod()
  const pointMap = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'Ad' }
  
  // 检查是否是Deuce (40-40)
  const isDeuceScore = p1Points >= 3 && p2Points >= 3 && p1Points === p2Points
  
  if (isDeuceScore) {
    return '40-40'
  }
  
  // 检查是否是Ad情况（占先制）
  if (method === 'ad') {
    if (p1Points >= 4 && p1Points > p2Points) {
      return 'Ad-40'
    } else if (p2Points >= 4 && p2Points > p1Points) {
      return '40-Ad'
    }
  }
  
  // 正常显示：15-0, 30-15, 40-30等（不显示0-0）
  const p1Display = pointMap[Math.min(p1Points, 3)] || p1Points
  const p2Display = pointMap[Math.min(p2Points, 3)] || p2Points
  
  return `${p1Display}-${p2Display}`
}

function formatPointScore(p1Points, p2Points, playerIndex) {
  // 格式化得分显示（保留用于其他地方）
  return formatGamePointScore(p1Points, p2Points)
}

function isDeuce() {
  if (!currentSet.value) return false
  const p1 = currentSet.value.player1Points || 0
  const p2 = currentSet.value.player2Points || 0
  return p1 >= 3 && p2 >= 3 && p1 === p2
}

function getDisplaySets() {
  // 获取要显示的盘分：只显示已完成的盘和当前盘
  if (!match.value) return []
  
  const sets = match.value.sets || []
  const displaySets = []
  
  // 添加已完成的盘
  sets.forEach(set => {
    displaySets.push(set)
  })
  
  // 如果有当前盘，也添加（作为"进行中"的盘）
  if (match.value.currentSet && (match.value.currentSet.player1Games > 0 || match.value.currentSet.player2Games > 0 || match.value.currentSet.player1Points > 0 || match.value.currentSet.player2Points > 0 || match.value.currentSet.isTiebreak)) {
    // 当前盘已经开始，添加到显示列表
    // 注意：当前盘不会在sets中，所以这里不需要添加
  }
  
  return displaySets
}

function getCurrentSetIndex() {
  // 获取当前盘的索引（在displaySets中的位置）
  if (!match.value || !match.value.sets) return 0
  // 当前盘是sets.length，但在displaySets中，如果当前盘已开始，索引就是sets.length
  return match.value.sets.length
}

function hasCurrentSet() {
  // 判断是否有当前盘（已开始但未结束）
  if (!match.value || !match.value.currentSet) return false
  const cs = match.value.currentSet
  // 如果比赛未结束，且有当前盘数据，说明当前盘已开始
  return match.value.status !== 'finished' && (cs.player1Games > 0 || cs.player2Games > 0 || cs.player1Points > 0 || cs.player2Points > 0 || cs.isTiebreak)
}

function getRoundName() {
  if (!match.value) return '比赛'
  const roundMap = {
    'group': '小组赛',
    'semi-final': '半决赛',
    'final': '决赛',
    'quarter-final': '四分之一决赛'
  }
  return roundMap[match.value.round] || match.value.round || '小组赛'
}

function formatMatchDate() {
  if (!match.value) return ''
  const date = match.value.started_at ? new Date(match.value.started_at) : 
               match.value.created_at ? new Date(match.value.created_at) : 
               new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function getPlayerInitial(name) {
  if (!name) return '?'
  // 获取名字的首个字符（支持中文和英文）
  return name.charAt(0).toUpperCase()
}

function getPlayer1SetsWon() {
  if (!match.value || !match.value.sets) return 0
  return match.value.sets.filter(s => s.winner === 'player1').length
}

function getPlayer2SetsWon() {
  if (!match.value || !match.value.sets) return 0
  return match.value.sets.filter(s => s.winner === 'player2').length
}

// 得分榜相关函数 - 返回每盘的局分（格式：player1-player2）
function getSetScores() {
  if (!match.value) return Array(5).fill({ player1: '-', player2: '-', winner: null })
  
  const scores = []
  const completedSets = match.value.sets || []
  const currentSet = match.value.currentSet
  
  // 生成5盘的数据
  for (let i = 0; i < 5; i++) {
    if (i < completedSets.length) {
      // 已完成的盘，显示局分（比如6-4）
      const set = completedSets[i]
      scores.push({
        player1: set.player1Games || 0,
        player2: set.player2Games || 0,
        winner: set.winner || null
      })
    } else if (i === completedSets.length && currentSet && currentSet.player1Games !== undefined) {
      // 当前进行中的盘，显示实时局分
      scores.push({
        player1: currentSet.player1Games || 0,
        player2: currentSet.player2Games || 0,
        winner: null // 当前盘未结束
      })
    } else {
      // 未开始的盘
      scores.push({ player1: '-', player2: '-', winner: null })
    }
  }
  
  return scores
}

function getSetTimes() {
  // 返回各盘用时，暂时返回占位符
  // 如果match有setTimes字段，使用它
  if (match.value && match.value.setTimes) {
    const times = [...match.value.setTimes]
    while (times.length < 5) {
      times.push('-')
    }
    return times.slice(0, 5)
  }
  
  // 默认返回占位符
  return Array(5).fill('-')
}

function getTotalMatchTime() {
  // 返回总用时
  if (match.value && match.value.totalTime) {
    return match.value.totalTime
  }
  
  // 如果有setTimes，计算总和
  if (match.value && match.value.setTimes) {
    const times = match.value.setTimes.filter(t => t !== '-')
    if (times.length > 0) {
      // 简化处理，返回第一个时间或计算总和
      return times[0] || '-'
    }
  }
  
  return '-'
}

// 获取所有局的信息（包括已完成的局和当前局）
function getAllGamesInfo() {
  if (!match.value) return []
  
  const gamesInfo = []
  const currentSet = match.value.currentSet
  const completedSets = match.value.sets || []
  
  // 获取当前盘的总盘分
  const totalSetsP1 = getPlayer1SetsWon()
  const totalSetsP2 = getPlayer2SetsWon()
  
  // 1. 显示当前盘已完成的局
  if (currentSet && currentSet.games && currentSet.games.length > 0) {
    let p1GamesBefore = 0
    let p2GamesBefore = 0
    
    currentSet.games.forEach((game, index) => {
      // 计算该局时的盘分和局分
      const setsScore = `${totalSetsP1}-${totalSetsP2}`
      const gamesScore = `${p1GamesBefore}-${p2GamesBefore}`
      
      // 获取该局的比分
      const pointMap = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }
      const p1Point = pointMap[game.player1Points] || game.player1Points
      const p2Point = pointMap[game.player2Points] || game.player2Points
      const pointsScore = `${p1Point}-${p2Point}`
      
      gamesInfo.push({
        gameNumber: game.gameNumber,
        server: game.server,
        setsScore: setsScore,
        setsScoreReverse: `${totalSetsP2}-${totalSetsP1}`,
        gamesScore: gamesScore,
        gamesScoreReverse: `${p2GamesBefore}-${p1GamesBefore}`,
        pointsScore: pointsScore
      })
      
      // 更新局分（为下一局准备）
      if (game.winner === 'player1') {
        p1GamesBefore++
      } else {
        p2GamesBefore++
      }
    })
  }
  
  // 2. 显示当前正在进行的局
  if (currentSet && !currentSet.isTiebreak) {
    const p1Games = currentSet.player1Games || 0
    const p2Games = currentSet.player2Games || 0
    const setsScore = `${totalSetsP1}-${totalSetsP2}`
    const gamesScore = `${p1Games}-${p2Games}`
    
    // 根据计分方式格式化当前局分
    const pointsScore = formatPointScore(currentSet.player1Points || 0, currentSet.player2Points || 0, 0)
    
    gamesInfo.push({
      gameNumber: (currentSet.games?.length || 0) + 1,
      server: currentSet.currentServer || 0,
      setsScore: setsScore,
      setsScoreReverse: `${totalSetsP2}-${totalSetsP1}`,
      gamesScore: gamesScore,
      gamesScoreReverse: `${p2Games}-${p1Games}`,
      pointsScore: pointsScore
    })
  }
  
  // 如果没有当前盘，至少显示一行初始状态
  if (gamesInfo.length === 0) {
    gamesInfo.push({
      gameNumber: 1,
      server: 0,
      setsScore: '0-0',
      setsScoreReverse: '0-0',
      gamesScore: '0-0',
      gamesScoreReverse: '0-0',
      pointsScore: '0-0'
    })
  }
  
  return gamesInfo
}

function getMatchInfo() {
  if (!match.value) return ''
  const tournament = tournamentInfo.value
  if (!tournament) return ''
  
  const parts = []
  if (tournament.format) {
    const formatMap = {
      'short-set': '短盘制',
      'best-of-3': '三盘两胜',
      'best-of-5': '五盘三胜'
    }
    parts.push(formatMap[tournament.format] || tournament.format)
  }
  if (match.value.group) {
    parts.push(`${match.value.group}组`)
  }
  if (match.value.round) {
    const roundMap = {
      'group': '小组赛',
      'semi-final': '半决赛',
      'final': '决赛',
      'quarter-final': '四分之一决赛'
    }
    parts.push(roundMap[match.value.round] || match.value.round)
  }
  return parts.join(' - ') || '比赛'
}

function formatMatchDateShort() {
  if (!match.value) return ''
  const date = match.value.started_at ? new Date(match.value.started_at) : 
               match.value.created_at ? new Date(match.value.created_at) : 
               new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

function getPlayerRanking(playerId) {
  // 这里可以从选手数据中获取排名，暂时返回空
  // 如果有排名数据，可以显示如"ATP 1"、"ATP 2"等
  return ''
}

function handleEditMatch() {
  initEditFormDate()
  showEditMatchDialog.value = true
}

function confirmServer() {
  if (match.value) {
    // 初始化currentSet如果不存在
    if (!match.value.currentSet) {
      match.value.currentSet = {
        player1Games: 0,
        player2Games: 0,
        player1Points: 0,
        player2Points: 0,
        isTiebreak: false,
        tiebreakScore: { player1: 0, player2: 0 },
        currentServer: parseInt(selectedServer.value),
        serveState: 'first',
        isGoldenPoint: false,
        games: []
      }
    } else {
      match.value.currentSet.currentServer = parseInt(selectedServer.value)
    }
    
    // 初始化统计数据
    initStats()
    
    // 开始比赛
    match.value.status = 'in-progress'
    match.value.started_at = new Date().toISOString()
    
    showServerDialog.value = false
    // 保存发球方设置和比赛状态
    saveMatch()
  }
}

function updateServer() {
  // 发球方切换逻辑已在scoring.js中处理
  // 这里不需要额外处理
}

function toggleSetDetail(index) {
  if (expandedSets.value.has(index)) {
    expandedSets.value.delete(index)
  } else {
    expandedSets.value.add(index)
  }
}

function formatGameScore(points) {
  const pointMap = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }
  return pointMap[points] || points
}

function getFinalScore() {
  if (!match.value || !match.value.sets || match.value.sets.length === 0) {
    return '0-0'
  }
  
  const scores = match.value.sets.map(set => {
    if (set.isTiebreak) {
      return `${set.player1Games}-${set.player2Games}(${set.tiebreakScore?.player1 || 0}-${set.tiebreakScore?.player2 || 0})`
    }
    return `${set.player1Games}-${set.player2Games}`
  })
  
  return scores.join(' / ')
}

// 记录当前分的发球信息（用于统计）
const currentPointServeInfo = ref({
  server: null,
  serveState: null,
  isAce: false,
  isDoubleFault: false
})

async function recordPoint(playerIndex, skipSound = false, isAce = false) {
  if (!match.value) return
  
  // 如果比赛已结束，不允许操作
  if (match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  // 保存当前状态用于撤销
  lastAction.value = JSON.parse(JSON.stringify(match.value))
  
  // 记录当前分的发球信息
  const currentServer = getCurrentServer()
  const serveState = currentSet.value?.serveState || 'first'
  currentPointServeInfo.value = {
    server: currentServer,
    serveState: serveState,
    isAce: isAce,
    isDoubleFault: false
  }
  
  // 获取比赛规则
  const tournament = await getTournament()
  const scoringMethod = tournament?.scoring_method || 'no-ad'
  
  // 确保match有format属性
  if (!match.value.format && tournament) {
    match.value.format = tournament.format || 'short-set'
  }
  
  // 记录得分
  const beforeGamesLength = match.value.currentSet?.games?.length || 0
  match.value = recordPointUtil(match.value, playerIndex, scoringMethod, match.value.format)
  
  // 如果这一局刚结束，更新最后一局的发球信息
  const afterGamesLength = match.value.currentSet?.games?.length || 0
  if (afterGamesLength > beforeGamesLength && match.value.currentSet.games) {
    const lastGame = match.value.currentSet.games[match.value.currentSet.games.length - 1]
    if (lastGame && currentPointServeInfo.value.server === playerIndex) {
      // 只有发球方得分时，才更新发球信息
      lastGame.firstServeIn = currentPointServeInfo.value.serveState === 'first'
      lastGame.isAce = currentPointServeInfo.value.isAce
      lastGame.isDoubleFault = currentPointServeInfo.value.isDoubleFault
    } else if (lastGame && currentPointServeInfo.value.server !== playerIndex) {
      // 接球方得分，默认标记为一发成功（因为接球方得分不意味着发球方发球失败）
      lastGame.firstServeIn = true
    }
  }
  
  // 如果这一分结束（赢得这一局），recordPoint函数会在新的一局开始时重置发球状态为一发
  // 如果这一分未结束，下一分还是由当前发球方发球，发球状态保持（可能是一发或二发）
  // 注意：如果接球方得分，下一分还是由发球方发球，但发球状态应该重置为一发
  if (match.value.currentSet && match.value.currentSet.currentServer !== playerIndex) {
    // 如果得分的是接球方，下一分还是由发球方发球，重置为一发
    match.value.currentSet.serveState = 'first'
  }
  
  // 更新发球方（根据网球规则）
  updateServer()
  
  // 更新状态
  if (match.value.status !== 'finished' && match.value.status === 'pending') {
    match.value.status = 'in-progress'
    match.value.started_at = new Date().toISOString()
  }
  
  // 如果比赛结束，自动保存并更新排名
  if (match.value.status === 'finished') {
    await saveMatch()
    if (!skipSound) {
      playSound('match')
    }
  } else if (!skipSound) {
    // 普通得分播放声音（ACE、双误、OUT已经播放过了）
    playSound('point')
  }
}

async function getTournament() {
  // 从match中获取tournament_id，然后加载tournament
  if (!match.value?.tournament_id) return null
  
  const tournaments = await storage.getTournaments()
  return tournaments.find(t => t.id === match.value.tournament_id)
}

// 初始化统计数据
function initStats() {
  if (!match.value.stats) {
    match.value.stats = {
      player1: {
        aces: 0,
        doubleFaults: 0
      },
      player2: {
        aces: 0,
        doubleFaults: 0
      }
    }
  } else {
    // 确保每个选手都有完整的统计字段
    if (!match.value.stats.player1) {
      match.value.stats.player1 = { aces: 0, doubleFaults: 0 }
    }
    if (!match.value.stats.player2) {
      match.value.stats.player2 = { aces: 0, doubleFaults: 0 }
    }
    if (match.value.stats.player1.aces === undefined) {
      match.value.stats.player1.aces = 0
    }
    if (match.value.stats.player1.doubleFaults === undefined) {
      match.value.stats.player1.doubleFaults = 0
    }
    if (match.value.stats.player2.aces === undefined) {
      match.value.stats.player2.aces = 0
    }
    if (match.value.stats.player2.doubleFaults === undefined) {
      match.value.stats.player2.doubleFaults = 0
    }
  }
}

// 增加ACE计数
function incrementAceCount(playerIndex) {
  initStats()
  const playerKey = playerIndex === 0 ? 'player1' : 'player2'
  match.value.stats[playerKey].aces++
}

// 增加双误计数
function incrementDoubleFaultCount(playerIndex) {
  initStats()
  const playerKey = playerIndex === 0 ? 'player1' : 'player2'
  match.value.stats[playerKey].doubleFaults++
}

// 选手操作函数
async function recordAceForPlayer(playerIndex) {
  if (!match.value || match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  // ACE球：只有发球方才能有ACE，发球方直接得分
  const currentServer = getCurrentServer()
  if (playerIndex !== currentServer) {
    showFailToast('只有发球方才能记录ACE')
    return
  }
  
  // 增加ACE计数
  incrementAceCount(playerIndex)
  
  playSound('ace')
  await recordPoint(playerIndex, true, true) // skipSound = true, isAce = true
}

async function recordDoubleFaultForPlayer(playerIndex) {
  if (!match.value || match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  // 双误：只有发球方才能有双误，接球方得分
  const currentServer = getCurrentServer()
  if (playerIndex !== currentServer) {
    showFailToast('只有发球方才能记录双误')
    return
  }
  
  // 保存当前状态用于撤销
  lastAction.value = JSON.parse(JSON.stringify(match.value))
  
  // 记录当前分的发球信息（双误）
  const serveState = currentSet.value?.serveState || 'first'
  currentPointServeInfo.value = {
    server: currentServer,
    serveState: serveState,
    isAce: false,
    isDoubleFault: true
  }
  
  // 增加双误计数
  incrementDoubleFaultCount(playerIndex)
  
  // 获取比赛规则
  const tournament = await getTournament()
  const scoringMethod = tournament?.scoring_method || 'no-ad'
  
  // 使用recordDoubleFault工具函数
  const beforeGamesLength = match.value.currentSet?.games?.length || 0
  match.value = recordDoubleFaultUtil(match.value, playerIndex, scoringMethod)
  
  // 如果这一局刚结束，更新最后一局的发球信息
  const afterGamesLength = match.value.currentSet?.games?.length || 0
  if (afterGamesLength > beforeGamesLength && match.value.currentSet.games) {
    const lastGame = match.value.currentSet.games[match.value.currentSet.games.length - 1]
    if (lastGame) {
      lastGame.firstServeIn = false // 双误说明一发失误
      lastGame.isAce = false
      lastGame.isDoubleFault = true
    }
  }
  
  playSound('fault')
  
  // 如果比赛结束，自动保存
  if (match.value.status === 'finished') {
    await saveMatch()
    playSound('match')
  }
}

function recordFirstServeFault(playerIndex) {
  if (!match.value || match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  // 一发失误：只有发球方才能有一发失误
  const currentServer = getCurrentServer()
  if (playerIndex !== currentServer) {
    showFailToast('只有发球方才能记录一发失误')
    return
  }
  
  // 保存当前状态用于撤销
  lastAction.value = JSON.parse(JSON.stringify(match.value))
  
  // 使用recordFirstServeFault工具函数
  match.value = recordFirstServeFaultUtil(match.value, playerIndex)
}

function setGoldenPointForCurrentGame(isGoldenPoint) {
  if (!match.value || match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  // 只有在Deuce情况下才能设置金球
  if (!isDeuce()) {
    showFailToast('只有在40-40（Deuce）时才能设置金球')
    return
  }
  
  // 保存当前状态用于撤销
  lastAction.value = JSON.parse(JSON.stringify(match.value))
  
  // 设置金球状态
  match.value = setGoldenPointUtil(match.value, isGoldenPoint)
  
  if (isGoldenPoint) {
    showSuccessToast('已设置为金球')
  }
}

function showScoreboardFullscreen() {
  showFullscreenScoreboard.value = true
}

function closeFullscreenScoreboard() {
  showFullscreenScoreboard.value = false
}

async function recordServeOut(playerIndex) {
  if (!match.value || match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  // 发球出界：只有发球方才能有发球出界
  const currentServer = getCurrentServer()
  if (playerIndex !== currentServer) {
    showFailToast('只有发球方才能记录发球出界')
    return
  }
  
  // 如果是一发，记录为一发失误（切换到二发）
  if (currentSet.value && currentSet.value.serveState === 'first') {
    // 保存当前状态用于撤销
    lastAction.value = JSON.parse(JSON.stringify(match.value))
    match.value = recordFirstServeFaultUtil(match.value, playerIndex)
    return
  }
  
  // 如果是二发出界，则是双误
  if (currentSet.value && currentSet.value.serveState === 'second') {
    recordDoubleFaultForPlayer(playerIndex)
    return
  }
  
  // 否则，接球方得分
  const receiver = playerIndex === 0 ? 1 : 0
  playSound('out')
  await recordPoint(receiver, true) // skipSound = true
}

function recordReturnOut(playerIndex) {
  if (!match.value || match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  // 回球出界：回球方出界，对手得分
  const opponent = playerIndex === 0 ? 1 : 0
  playSound('out')
  recordPoint(opponent, true) // skipSound = true
}

// 保留旧函数以兼容
function recordAce() {
  const server = getCurrentServer()
  recordAceForPlayer(server)
}

function recordDoubleFault() {
  const server = getCurrentServer()
  recordDoubleFaultForPlayer(server)
}

function confirmOut() {
  if (!match.value || match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    showOutDialog.value = false
    return
  }
  
  // OUT：OUT方失分，对手得分
  const outPlayer = parseInt(selectedOutPlayer.value)
  recordReturnOut(outPlayer)
  showOutDialog.value = false
}

function undoLast() {
  if (!lastAction.value) {
    showFailToast('没有可撤销的操作')
    return
  }
  
  if (match.value?.status === 'finished') {
    showFailToast('比赛已结束，无法撤销操作')
    return
  }
  
  match.value = lastAction.value
  lastAction.value = null
  showSuccessToast('已撤销')
}

function playSound(type) {
  try {
    // 停止之前的语音
    window.speechSynthesis.cancel()
    
    // 使用Web Speech API合成语音（模拟网球比赛音频）
    const utterance = new SpeechSynthesisUtterance()
    utterance.lang = 'en-US'
    utterance.rate = 0.9 // 稍微慢一点，更像裁判
    utterance.pitch = 0.8 // 稍微低一点，更像男性裁判
    utterance.volume = 1.0
    
    // 根据类型设置不同的语音文本（网球比赛常用术语）
    const soundTexts = {
      'ace': 'Ace',
      'fault': 'Fault',
      'out': 'Out',
      'point': 'Point',
      'game': 'Game',
      'set': 'Set',
      'match': 'Match'
    }
    
    utterance.text = soundTexts[type] || 'Point'
    
    // 播放语音
    window.speechSynthesis.speak(utterance)
  } catch (error) {
    console.log('语音播放失败:', error)
    // 如果语音API不可用，可以尝试播放音频文件
    // const audio = new Audio(`/sounds/${type}.mp3`)
    // audio.play().catch(e => console.log('音频播放失败:', e))
  }
}

async function saveScore() {
  if (!match.value) return
  
  // 如果比赛已完成，提示用户
  if (match.value.status === 'finished') {
    showFailToast('比赛已结束，无法修改比分')
    return
  }
  
  saving.value = true
  
  try {
    await saveMatch()
    showSuccessToast('比分保存成功')
  } catch (error) {
    showFailToast('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

async function loadMatch() {
  try {
    const matchId = route.params.id
    const tournamentId = route.query.tournament // 从查询参数获取tournament_id
    console.log('🔍 开始加载比赛，路由参数ID:', matchId, 'Tournament ID:', tournamentId, '类型:', typeof matchId)
    
    if (!matchId) {
      showFailToast('比赛ID不存在')
      return
    }
    
    // 重置match值，避免显示旧数据
    match.value = null
    
    // 支持字符串和数字类型的ID
    const matchIdNum = typeof matchId === 'string' ? parseInt(matchId) : matchId
    const tournamentIdNum = tournamentId ? (typeof tournamentId === 'string' ? parseInt(tournamentId) : tournamentId) : null
    console.log('🔍 转换后的ID:', matchIdNum, 'Tournament ID:', tournamentIdNum)
    
    // 从所有tournament中查找match
    const tournaments = await storage.getTournaments()
    
    let foundMatch = null
    let foundTournament = null
    
    // 如果指定了tournament_id，优先从该tournament中查找
    if (tournamentIdNum) {
      const tournament = tournaments.find(t => {
        const tId = t.id
        return tId === tournamentIdNum || tId === tournamentId || String(tId) === String(tournamentId)
      })
      if (tournament && tournament.matches && Array.isArray(tournament.matches)) {
        foundMatch = tournament.matches.find(m => {
          const mId = m.id
          return mId === matchId || mId === matchIdNum || String(mId) === String(matchId)
        })
        if (foundMatch) {
          foundTournament = tournament
          console.log('✅ 从指定tournament中找到比赛:', {
            id: foundMatch.id,
            player1: foundMatch.player1_name,
            player2: foundMatch.player2_name,
            tournament: tournament.name
          })
        }
      }
    }
    
    // 如果没找到，遍历所有tournament查找
    if (!foundMatch) {
      console.log('🔍 未在指定tournament中找到，遍历所有tournament查找...')
      for (const tournament of tournaments) {
        if (tournament.matches && Array.isArray(tournament.matches)) {
          // 支持字符串和数字类型的ID匹配
          foundMatch = tournament.matches.find(m => {
            const mId = m.id
            const match = mId === matchId || mId === matchIdNum || String(mId) === String(matchId)
            if (match) {
              console.log('✅ 找到比赛:', {
                id: m.id,
                player1: m.player1_name,
                player2: m.player2_name,
                tournament: tournament.name,
                tournamentId: tournament.id
              })
            }
            return match
          })
          if (foundMatch) {
            foundTournament = tournament
            console.log('✅ 找到匹配的tournament:', tournament.name, 'ID:', tournament.id)
            break
          }
        }
      }
    }
    
    // 如果还是没找到，输出调试信息
    if (!foundMatch) {
      console.error('❌ 未找到比赛，调试信息:')
      console.error('  - Match ID:', matchId, '类型:', typeof matchId)
      console.error('  - Tournament ID:', tournamentId, '类型:', typeof tournamentId)
      console.error('  - 所有tournaments:', tournaments.map(t => ({
        id: t.id,
        name: t.name,
        matchCount: t.matches?.length || 0,
        matchIds: t.matches?.map(m => m.id) || []
      })))
    }
    
    if (!foundMatch || !foundTournament) {
      console.error('❌ 未找到比赛，ID:', matchId)
      showFailToast('未找到比赛')
      return
    }
    
    // 深拷贝比赛数据，确保不会引用旧数据
    match.value = JSON.parse(JSON.stringify(foundMatch))
    match.value.tournament_id = foundTournament.id
    match.value.format = foundTournament.format // 保存比赛格式
    
    console.log('📋 加载的比赛数据:', {
      id: match.value.id,
      player1: match.value.player1_name,
      player2: match.value.player2_name,
      status: match.value.status
    })
    
    // 加载比赛信息
    tournamentInfo.value = foundTournament
    
    // 如果比赛未开始，必须先设置发球方才能开始
    if (match.value.status === 'pending') {
      // 重置发球方选择为默认值（player1）
      selectedServer.value = '0'
      // 显示发球方选择对话框（必须设置才能开始）
      // 使用 nextTick 确保 match.value 已经正确设置到响应式系统中
      await nextTick()
      showServerDialog.value = true
      return
    }
    
    // 初始化currentSet如果不存在
    if (!match.value.currentSet) {
      match.value.currentSet = {
        player1Games: 0,
        player2Games: 0,
        player1Points: 0,
        player2Points: 0,
        isTiebreak: false,
        tiebreakScore: { player1: 0, player2: 0 },
        currentServer: 0, // 默认player1发球
        serveState: 'first',
        isGoldenPoint: false,
        games: [] // 初始化局分记录数组
      }
    }
    
    // 如果没有设置发球方，默认player1发球
    if (match.value.currentSet.currentServer === undefined) {
      match.value.currentSet.currentServer = 0
    }
    
    // 确保有发球状态
    if (match.value.currentSet.serveState === undefined) {
      match.value.currentSet.serveState = 'first'
    }
    
    // 确保有金球状态
    if (match.value.currentSet.isGoldenPoint === undefined) {
      match.value.currentSet.isGoldenPoint = false
    }
    
    // 确保有games数组
    if (!match.value.currentSet.games) {
      match.value.currentSet.games = []
    }
    
    // 初始化统计数据
    initStats()
  } catch (error) {
    console.error('加载比赛失败:', error)
    showFailToast('加载失败：' + error.message)
  }
}

// 获取要统计的盘数据
function getStatisticsSet(setIndex) {
  if (setIndex === -1) {
    // 返回所有盘的数据
    return null
  }
  if (setIndex < completedSets.value.length) {
    return completedSets.value[setIndex]
  }
  if (setIndex === completedSets.value.length && currentSet.value) {
    return currentSet.value
  }
  return null
}

// 统计相关函数
function getAceCount(player, setIndex = -1) {
  if (!match.value) return 0
  const playerKey = player === 'player1' ? 'player1' : 'player2'
  
  // 如果统计整个比赛
  if (setIndex === -1) {
    initStats()
    return match.value.stats?.[playerKey]?.aces || 0
  }
  
  // 统计特定盘
  const set = getStatisticsSet(setIndex)
  if (!set) return 0
  
  // 从该盘的games中统计ACE（如果有记录）
  let count = 0
  if (set.games) {
    set.games.forEach(game => {
      if (game.server === (player === 'player1' ? 0 : 1) && game.isAce) {
        count++
      }
    })
  }
  
  return count
}

function getDoubleFaultCount(player, setIndex = -1) {
  if (!match.value) return 0
  const playerKey = player === 'player1' ? 'player1' : 'player2'
  
  // 如果统计整个比赛
  if (setIndex === -1) {
    initStats()
    return match.value.stats?.[playerKey]?.doubleFaults || 0
  }
  
  // 统计特定盘
  const set = getStatisticsSet(setIndex)
  if (!set) return 0
  
  // 从该盘的games中统计双误（如果有记录）
  let count = 0
  if (set.games) {
    set.games.forEach(game => {
      if (game.server === (player === 'player1' ? 0 : 1) && game.isDoubleFault) {
        count++
      }
    })
  }
  
  return count
}

// 获取一发得分点（格式：54/112 (48%)）
// 一发得分点 = 一发成功的发球局数中，发球方赢得的局数
function getFirstServePointsWon(player, setIndex = -1) {
  const stats = getServeStatistics(player, setIndex)
  const total = stats.firstServeTotal // 一发总数（发球局数）
  const won = stats.firstServeWon // 一发得分数（一发成功且发球方赢得的局数）
  if (total === 0) return '0/0 (0%)'
  const percentage = Math.round((won / total) * 100)
  return `${won}/${total} (${percentage}%)`
}

// 获取一发得分率（格式：37/54 (69%)）
// 一发得分率 = 一发成功的发球局数中，发球方赢得的局数 / 一发成功的发球局数
function getFirstServeWinRate(player, setIndex = -1) {
  const stats = getServeStatistics(player, setIndex)
  const total = stats.firstServeIn // 一发成功数（一发成功的发球局数）
  const won = stats.firstServeWon // 一发得分数（一发成功且发球方赢得的局数）
  if (total === 0) return '0/0 (0%)'
  const percentage = Math.round((won / total) * 100)
  return `${won}/${total} (${percentage}%)`
}

// 获取二发得分率（格式：28/58 (48%)）
// 二发得分率 = 二发的发球局数中，发球方赢得的局数 / 二发的发球局数
function getSecondServeWinRate(player, setIndex = -1) {
  const stats = getServeStatistics(player, setIndex)
  const total = stats.secondServeTotal // 二发总数（二发的发球局数）
  const won = stats.secondServeWon // 二发得分数（二发且发球方赢得的局数）
  if (total === 0) return '0/0 (0%)'
  const percentage = Math.round((won / total) * 100)
  return `${won}/${total} (${percentage}%)`
}

// 获取发球统计数据
function getServeStatistics(player, setIndex = -1) {
  const playerIndex = player === 'player1' ? 0 : 1
  let firstServeTotal = 0 // 一发总数（发球局数）
  let firstServeIn = 0 // 一发成功数（一发成功的发球局数）
  let firstServeWon = 0 // 一发得分数（一发成功且发球方赢得的局数）
  let secondServeTotal = 0 // 二发总数（二发的发球局数）
  let secondServeWon = 0 // 二发得分数（二发且发球方赢得的局数）
  
  // 收集要统计的盘
  const setsToCount = []
  if (setIndex === -1) {
    // 统计整个比赛：所有已完成的盘 + 当前盘
    if (match.value.sets) {
      setsToCount.push(...match.value.sets)
    }
    if (currentSet.value) {
      setsToCount.push(currentSet.value)
    }
  } else {
    // 统计特定盘
    const set = getStatisticsSet(setIndex)
    if (set) {
      setsToCount.push(set)
    }
  }
  
  // 遍历所有要统计的盘
  setsToCount.forEach(set => {
    if (set && set.games) {
      set.games.forEach(game => {
        if (game.server === playerIndex) {
          // 这是一个发球局
          firstServeTotal++
          
          // 检查一发是否成功
          // 如果firstServeIn为false，说明一发失误，进入二发
          // 如果firstServeIn为true或undefined，说明一发成功
          const firstServeInThisGame = game.firstServeIn !== false
          
          if (firstServeInThisGame) {
            // 一发成功
            firstServeIn++
            // 如果这一局该选手赢了，说明一发得分
            if (game.winner === (playerIndex === 0 ? 'player1' : 'player2')) {
              firstServeWon++
            }
          } else {
            // 一发失误，进入二发
            secondServeTotal++
            // 如果这一局该选手赢了，说明二发得分
            if (game.winner === (playerIndex === 0 ? 'player1' : 'player2')) {
              secondServeWon++
            }
          }
        }
      })
    }
  })
  
  return {
    firstServeTotal,
    firstServeIn,
    firstServeWon,
    secondServeTotal,
    secondServeWon
  }
}

function getSelectedSet() {
  if (selectedSetIndex.value === -1) {
    // 返回所有盘的数据
    return null
  }
  if (selectedSetIndex.value < completedSets.value.length) {
    return completedSets.value[selectedSetIndex.value]
  }
  if (selectedSetIndex.value === completedSets.value.length && currentSet.value) {
    return currentSet.value
  }
  return null
}

function getSelectedSetGames() {
  const set = getSelectedSet()
  if (!set) return []
  return set.games || []
}

function getPlayerPoints(game, player) {
  // 返回该选手在这一局中的所有得分点
  // 简化实现：根据最终得分推断得分序列
  if (!game) return []
  const playerKey = player === 'player1' ? 'player1' : 'player2'
  const points = game[`${playerKey}Points`] || 0
  
  // 生成得分序列（简化版）
  const pointSequence = []
  for (let i = 0; i < points; i++) {
    pointSequence.push(i)
  }
  return pointSequence
}

// formatPointScore 函数已在上面定义（支持金球制），这里删除重复定义

function getGameFinalScore(game) {
  // 返回该局的最终比分（显示该局结束时双方的局数）
  if (!game) return '0-0'
  const set = getSelectedSet()
  if (!set) return '0-0'
  
  // 计算该局结束时双方的局数
  let p1Games = 0
  let p2Games = 0
  
  if (selectedSetIndex.value === -1) {
    // 如果是"比赛"视图，显示总盘数
    p1Games = getPlayer1SetsWon()
    p2Games = getPlayer2SetsWon()
  } else {
    // 显示该盘中的局数
    const games = set.games || []
    const gameIndex = games.findIndex(g => g.gameNumber === game.gameNumber)
    if (gameIndex >= 0) {
      // 计算到这一局为止的局数
      for (let i = 0; i <= gameIndex; i++) {
        if (games[i].winner === 'player1') p1Games++
        else if (games[i].winner === 'player2') p2Games++
      }
    }
  }
  
  return `${p1Games}-${p2Games}`
}

async function saveMatch() {
  if (!match.value) return
  
  try {
    // 获取比赛所属的tournament
    const tournaments = await storage.getTournaments()
    const tournament = tournaments.find(t => t.id === match.value.tournament_id)
    
    if (!tournament) {
      throw new Error('找不到比赛所属的赛事')
    }
    
    // 更新比赛数据
    const matchIndex = tournament.matches.findIndex(m => m.id === match.value.id)
    if (matchIndex === -1) {
      throw new Error('找不到比赛记录')
    }
    
    tournament.matches[matchIndex] = { ...match.value }
    
    // 如果任意一场比赛开始，更新比赛状态为进行中
    if (match.value.status === 'in-progress') {
      // 检查比赛当前状态，如果是草稿或报名中，则更新为小组赛
      if (tournament.status === 'draft' || tournament.status === 'registration') {
        tournament.status = 'group-stage'
        console.log('✅ 比赛已开始，更新比赛状态为：小组赛')
      }
    }
    
    // 如果比赛结束，更新排名并检查是否需要生成淘汰赛
    if (match.value.status === 'finished') {
      // 自动更新小组排名（如果有分组）
      if (tournament.players && tournament.players.length > 0) {
        const { getAllGroupRankings, getQualifiedPlayers } = await import('../utils/ranking')
        const { generateKnockoutMatches } = await import('../utils/draw')
        
        const rankings = getAllGroupRankings(tournament.players, tournament.matches)
        console.log('✅ 比赛结束，排名已更新', rankings)
        
        // 检查小组赛是否全部完成，如果完成则自动生成淘汰赛
        if (tournament.group_method && tournament.group_method !== 'no-groups') {
          const groupMatches = tournament.matches.filter(m => m.group && m.round === 'group')
          const allGroupMatchesFinished = groupMatches.length > 0 && 
            groupMatches.every(m => m.status === 'finished')
          
          if (allGroupMatchesFinished) {
            // 检查是否已经生成过淘汰赛
            const hasKnockoutMatches = tournament.matches.some(m => 
              m.round === 'semi-final' || m.round === 'final'
            )
            
            // 检查是否有占位符比赛
            const hasPlaceholder = tournament.matches.some(m => m.isPlaceholder)
            const hasRealKnockout = tournament.matches.some(m => 
              (m.round === 'semi-final' || m.round === 'final') && !m.isPlaceholder
            )
            
            if (!hasKnockoutMatches || hasPlaceholder) {
              // 获取出线选手
              const qualifiedPlayers = getQualifiedPlayers(rankings)
              
              if (qualifiedPlayers.length >= 2) {
                // 生成淘汰赛（根据分组方式）
                const knockoutMatches = generateKnockoutMatches(qualifiedPlayers, tournament.id, tournament.group_method)
                
                // 移除占位符比赛
                tournament.matches = tournament.matches.filter(m => !m.isPlaceholder)
                
                // 添加实际比赛
                tournament.matches.push(...knockoutMatches)
                
                console.log('✅ 小组赛完成，已自动生成淘汰赛对阵', knockoutMatches)
                showSuccessToast('小组赛完成，已自动生成淘汰赛对阵')
              }
            } else {
              // 检查是否需要生成下一轮比赛
              const { generateNextRoundMatches } = await import('../utils/draw')
              
              // 检查小组赛是否完成（分组模式）
              if (tournament.group_method && tournament.group_method !== 'no-groups') {
                const groupMatches = tournament.matches.filter(m => m.group && (!m.round || m.round === 'group'))
                if (groupMatches.length > 0 && groupMatches.every(m => m.status === 'finished')) {
                  const hasSemiFinal = tournament.matches.some(m => m.round === 'semi-final')
                  if (!hasSemiFinal) {
                    const { getAllGroupRankings, getQualifiedPlayers } = await import('../utils/ranking')
                    const rankings = getAllGroupRankings(tournament.players, tournament.matches)
                    const qualifiedPlayers = getQualifiedPlayers(rankings)
                    if (qualifiedPlayers.length >= 4) {
                      const { generateKnockoutMatches } = await import('../utils/draw')
                      const semiFinalMatches = generateKnockoutMatches(qualifiedPlayers, tournament.id, tournament.group_method)
                      tournament.matches.push(...semiFinalMatches)
                      console.log('✅ 小组赛完成，已自动生成半决赛', semiFinalMatches)
                      showSuccessToast('小组赛完成，已自动生成半决赛')
                    }
                  }
                }
              }
              
              // 检查半决赛是否完成（分组模式）
              const semiFinalMatches = tournament.matches.filter(m => m.round === 'semi-final' && !m.isPlaceholder)
              if (semiFinalMatches.length > 0 && semiFinalMatches.every(m => m.status === 'finished')) {
                const hasFinal = tournament.matches.some(m => m.round === 'final' && !m.isPlaceholder)
                if (!hasFinal) {
                  // 移除决赛占位符（如果有）
                  tournament.matches = tournament.matches.filter(m => !(m.round === 'final' && m.isPlaceholder))
                  
                  const finalMatches = generateNextRoundMatches(tournament.matches, 'semi-final', tournament.id, tournament.group_method)
                  tournament.matches.push(...finalMatches)
                  console.log('✅ 半决赛完成，已自动生成决赛', finalMatches)
                  showSuccessToast('半决赛完成，已自动生成决赛')
                }
              }
              
              // 不分组模式：检查各轮次
              if (tournament.group_method === 'no-groups') {
                // 检查第一轮
                const round1Matches = tournament.matches.filter(m => m.round === 'round-1')
                if (round1Matches.length > 0 && round1Matches.every(m => m.status === 'finished')) {
                  const hasRound2 = tournament.matches.some(m => m.round === 'round-2')
                  if (!hasRound2 && round1Matches.length === 8) {
                    const round2Matches = generateNextRoundMatches(tournament.matches, 'round-1', tournament.id, 'no-groups')
                    tournament.matches.push(...round2Matches)
                    console.log('✅ 第一轮完成，已自动生成第二轮', round2Matches)
                    showSuccessToast('第一轮完成，已自动生成第二轮')
                  } else if (!hasRound2 && round1Matches.length === 4) {
                    const semiFinalMatches = generateNextRoundMatches(tournament.matches, 'round-1', tournament.id, 'no-groups')
                    tournament.matches.push(...semiFinalMatches)
                    console.log('✅ 第一轮完成，已自动生成半决赛', semiFinalMatches)
                    showSuccessToast('第一轮完成，已自动生成半决赛')
                  }
                }
                
                // 检查第二轮
                const round2Matches = tournament.matches.filter(m => m.round === 'round-2')
                if (round2Matches.length > 0 && round2Matches.every(m => m.status === 'finished')) {
                  const hasSemiFinal = tournament.matches.some(m => m.round === 'semi-final')
                  if (!hasSemiFinal) {
                    const semiFinalMatches = generateNextRoundMatches(tournament.matches, 'round-2', tournament.id, 'no-groups')
                    tournament.matches.push(...semiFinalMatches)
                    console.log('✅ 第二轮完成，已自动生成半决赛', semiFinalMatches)
                    showSuccessToast('第二轮完成，已自动生成半决赛')
                  }
                }
                
                // 检查8分之一决赛
                const roundOf16Matches = tournament.matches.filter(m => m.round === 'round-of-16')
                if (roundOf16Matches.length > 0 && roundOf16Matches.every(m => m.status === 'finished')) {
                  const hasQuarterFinal = tournament.matches.some(m => m.round === 'quarter-final')
                  if (!hasQuarterFinal) {
                    const quarterFinalMatches = generateNextRoundMatches(tournament.matches, 'round-of-16', tournament.id, 'no-groups')
                    tournament.matches.push(...quarterFinalMatches)
                    console.log('✅ 16强完成，已自动生成8强', quarterFinalMatches)
                    showSuccessToast('16强完成，已自动生成8强')
                  }
                }
                
                // 检查四分之一决赛（8强）
                const quarterFinalMatches = tournament.matches.filter(m => m.round === 'quarter-final')
                if (quarterFinalMatches.length > 0 && quarterFinalMatches.every(m => m.status === 'finished')) {
                  const hasSemiFinal = tournament.matches.some(m => m.round === 'semi-final')
                  if (!hasSemiFinal) {
                    const semiFinalMatches = generateNextRoundMatches(tournament.matches, 'quarter-final', tournament.id, 'no-groups')
                    tournament.matches.push(...semiFinalMatches)
                    console.log('✅ 8强完成，已自动生成4强', semiFinalMatches)
                    showSuccessToast('8强完成，已自动生成4强')
                  }
                }
                
                // 检查半决赛（4强）
                const noGroupSemiFinalMatches = tournament.matches.filter(m => m.round === 'semi-final')
                if (noGroupSemiFinalMatches.length > 0 && noGroupSemiFinalMatches.every(m => m.status === 'finished')) {
                  const hasFinal = tournament.matches.some(m => m.round === 'final')
                  if (!hasFinal) {
                    const finalMatches = generateNextRoundMatches(tournament.matches, 'semi-final', tournament.id, 'no-groups')
                    tournament.matches.push(...finalMatches)
                    console.log('✅ 4强完成，已自动生成决赛', finalMatches)
                    showSuccessToast('4强完成，已自动生成决赛')
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 保存到storage
    await storage.saveTournament(tournament)
    
    if (match.value.status === 'finished') {
      // 延迟显示成功提示，避免与自动生成淘汰赛的提示冲突
      setTimeout(() => {
        if (!tournament.matches.some(m => (m.round === 'semi-final' || m.round === 'final') && m.id !== match.value.id)) {
          showSuccessToast('比赛结束，比分已保存')
        }
      }, 500)
    }
  } catch (error) {
    console.error('保存失败:', error)
    showFailToast('保存失败：' + error.message)
  }
}

// 编辑比赛相关函数
function initEditFormDate() {
  if (!match.value) return
  
  const matchDate = match.value.start_date || tournamentInfo.value?.start_date || ''
  const matchTime = match.value.start_time || tournamentInfo.value?.start_time || '14:00'
  
  if (matchDate) {
    const [year, month, day] = matchDate.split('-')
    datePickerValue.value = [year || '2025', month || '01', day || '01']
  } else {
    const now = new Date()
    datePickerValue.value = [
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ]
  }
  
  if (matchTime) {
    const [hours, minutes] = matchTime.split(':')
    timePickerValue.value = [hours || '14', minutes || '00']
  } else {
    timePickerValue.value = ['14', '00']
  }
  
  matchEditForm.value = {
    start_date: match.value.start_date || tournamentInfo.value?.start_date || '',
    start_time: match.value.start_time || tournamentInfo.value?.start_time || '',
    location: match.value.location || tournamentInfo.value?.location || ''
  }
}

function onDateConfirm({ selectedValues }) {
  const [year, month, day] = selectedValues
  matchEditForm.value.start_date = `${year}-${month}-${day}`
  showDatePicker.value = false
}

function onTimeConfirm({ selectedValues }) {
  const [hours, minutes] = selectedValues
  matchEditForm.value.start_time = `${hours}:${minutes}`
  showTimePicker.value = false
}

async function saveMatchEdit() {
  if (!match.value) return
  
  try {
    // 更新比赛信息
    match.value.start_date = matchEditForm.value.start_date
    match.value.start_time = matchEditForm.value.start_time
    match.value.location = matchEditForm.value.location
    
    // 保存到storage
    const tournaments = await storage.getTournaments()
    const tournament = tournaments.find(t => t.id === match.value.tournament_id)
    
    if (tournament) {
      const matchIndex = tournament.matches.findIndex(m => m.id === match.value.id)
      if (matchIndex !== -1) {
        tournament.matches[matchIndex] = { ...match.value }
        await storage.saveTournament(tournament)
        showSuccessToast('比赛信息已更新')
        showEditMatchDialog.value = false
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    showFailToast('保存失败：' + error.message)
  }
}

onMounted(() => {
  loadMatch()
})

// 监听路由变化，重新加载比赛数据（解决移动端跳转问题）
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    console.log('🔄 路由参数变化，重新加载比赛:', oldId, '->', newId)
    loadMatch()
  }
})

// 监听查询参数变化（tournament_id）
watch(() => route.query.tournament, (newTournamentId, oldTournamentId) => {
  if (newTournamentId !== oldTournamentId) {
    console.log('🔄 查询参数变化，重新加载比赛:', oldTournamentId, '->', newTournamentId)
    loadMatch()
  }
})
</script>

<style scoped>
.match-score {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
  padding-bottom: 50px;
}

.content {
  padding: 0;
  padding-bottom: 80px;
}

/* 比赛标题区域 */
.match-title-section {
  padding: 16px;
  background: white;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.match-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.match-info {
  font-size: 13px;
  color: #64748b;
}

/* 比赛头部 */
.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.header-left .round-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.header-right .match-date {
  font-size: 14px;
  color: #64748b;
}

/* 比赛结果展示区域 */
.match-result-area {
  background: #f1f5f9;
  padding: 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.player-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.player-left {
  align-items: flex-start;
}

.player-right {
  align-items: flex-end;
}

.player-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.clickable-avatar {
  cursor: pointer;
}

.clickable-avatar:active:not(.disabled) {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.clickable-avatar.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.player-right .player-avatar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.avatar-text {
  font-size: 24px;
  font-weight: 600;
  color: white;
}

.star-icon {
  position: absolute;
  top: -4px;
  right: -4px;
  background: white;
  border-radius: 50%;
  padding: 2px;
}

.player-name {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  text-align: center;
}

.player-ranking {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  margin-top: 4px;
}

.star-icon-left {
  position: absolute;
  left: 0;
  top: 0;
}

.star-icon-right {
  position: absolute;
  right: 0;
  top: 0;
}

.match-status-badge {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 16px;
  display: inline-block;
  margin-bottom: 8px;
}

.match-date-small {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 导航栏 */
.match-nav-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 16px;
}

.nav-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #64748b;
  position: relative;
  cursor: pointer;
  transition: color 0.2s;
}

.nav-tab.active {
  color: #3b82f6;
  font-weight: 500;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

.match-content {
  padding: 16px;
}

.tab-content {
  min-height: 200px;
}

/* 盘次选择器 */
.set-selector {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.set-tab {
  padding: 6px 16px;
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 16px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.set-tab.active {
  background: #3b82f6;
  color: white;
}

/* 统计数据 */
.statistics-content {
  padding-top: 16px;
}

.stat-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-badge {
  background: #1e293b;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 统计资料样式 */
/* 资料统计样式 */
.statistics-sub-nav {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.sub-nav-item {
  padding: 6px 16px;
  font-size: 13px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 16px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-nav-item.active {
  background: #3b82f6;
  color: white;
  font-weight: 600;
}

.statistics-table-container {
  padding: 16px;
  background: white;
  margin-top: 16px;
  border-radius: 8px;
}

.statistics-table {
  width: 100%;
}

.stat-category {
  margin-bottom: 24px;
}

.category-header {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 16px;
  padding: 12px 0;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-value-left,
.stat-value-right {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

.stat-value-right.highlight {
  background: #1e293b;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  display: inline-block;
  min-width: 60px;
}

.stat-label-center {
  font-size: 14px;
  color: #64748b;
  text-align: center;
}

.statistics-container {
  padding: 16px;
  background: white;
  margin-top: 16px;
  border-radius: 8px;
}

.statistics-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  text-align: center;
}

.player-statistics {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.player-statistics:last-child {
  margin-bottom: 0;
}

.player-stat-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.player-stat-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.stat-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-value.ace-value {
  color: #10b981;
}

.stat-value.fault-value {
  color: #ef4444;
}

/* 逐球比分 */
.point-by-point-content {
  padding-top: 16px;
}

.game-points {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.game-score {
  font-size: 12px;
  color: #64748b;
}

.points-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-points {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.player1-points {
  justify-content: flex-start;
}

.player2-points {
  justify-content: flex-end;
}

.point-item {
  font-size: 13px;
  color: #64748b;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
}

.score-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.match-status {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.match-score-large {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.score-number {
  min-width: 40px;
  text-align: center;
}

.score-separator {
  color: #94a3b8;
  font-weight: 400;
}

.set-result {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.set-result .winner {
  font-weight: bold;
  color: #6366f1;
}

.set-result .score {
  color: #64748b;
  font-weight: 500;
}

.set-result .score-separator {
  color: #94a3b8;
  margin: 0 4px;
}

.set-result .winner-score {
  color: #6366f1;
  font-weight: bold;
}

.set-result .tiebreak {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 4px;
}

.set-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.set-title .winner-name {
  font-weight: bold;
  color: #6366f1;
}

.set-detail {
  margin-top: 8px;
  padding-left: 16px;
}

.game-result {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.game-result .winner {
  font-weight: bold;
  color: #6366f1;
}

.server-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  font-size: 12px;
  color: #f59e0b;
}

.tiebreak-detail {
  font-size: 14px;
  color: #64748b;
}

/* 浮动操作按钮（全部显示） */
.fab-buttons {
  position: fixed;
  right: 16px;
  bottom: 80px; /* 在底部导航和保存按钮上方 */
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding-right: 4px;
}

/* 滚动条样式 */
.fab-buttons::-webkit-scrollbar {
  width: 4px;
}

.fab-buttons::-webkit-scrollbar-track {
  background: transparent;
}

.fab-buttons::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.fab-item {
  background: white;
  border-radius: 24px;
  padding: 10px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 13px;
  min-width: 140px;
  max-width: 180px;
}

.fab-item:active {
  transform: scale(0.95);
}

.fab-item-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.fab-item-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.fab-item-ace {
  color: #f59e0b;
  border: 1px solid #f59e0b;
}

.fab-item-fault {
  color: #ef4444;
  border: 1px solid #ef4444;
}

.fab-item-out {
  color: #dc2626;
  border: 1px solid #dc2626;
}

.fab-item-undo {
  color: #64748b;
  border: 1px solid #64748b;
}

.fab-item.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

/* 吸底保存按钮 */
.save-button-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 99;
}

.match-score {
  padding-bottom: 280px; /* 为吸底按钮和操作按钮组留出空间 */
}

/* 得分榜样式 */
.scoreboard-container {
  padding: 16px;
  background: white;
  margin-top: 16px;
  border-radius: 8px;
}

.scoreboard-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.scoreboard-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.fullscreen-btn {
  font-size: 12px;
}

.fullscreen-scoreboard-popup {
  border-radius: 12px;
  overflow: hidden;
}

.fullscreen-scoreboard-popup.landscape {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

/* 全屏页面容器 */
.fullscreen-page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #f8fafc;
}

/* 全屏页面头部 */
.fullscreen-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: #1e293b;
  color: white;
  flex-shrink: 0;
}

.fullscreen-title {
  font-size: 24px;
  font-weight: 600;
}

.close-icon {
  font-size: 24px;
  cursor: pointer;
  color: white;
  padding: 8px;
}

.close-icon:hover {
  opacity: 0.8;
}

/* 全屏导航栏 */
.fullscreen-nav-tabs {
  display: flex;
  gap: 0;
  background: white;
  border-bottom: 2px solid #e5e7eb;
  padding: 0 40px;
  flex-shrink: 0;
}

.fullscreen-nav-tab {
  padding: 16px 32px;
  font-size: 16px;
  color: #64748b;
  background: transparent;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.fullscreen-nav-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 600;
}

.fullscreen-nav-tab:hover {
  color: #3b82f6;
}

/* 全屏页面内容 */
.fullscreen-page-content {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
  background: #f8fafc;
}

.fullscreen-tab-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.digital-scoreboard.fullscreen-version {
  margin: 0;
  box-shadow: none;
  border: none;
  width: 100%;
  max-width: 100%;
}

.digital-scoreboard.fullscreen-version .scoreboard-header {
  padding: 32px 60px;
  grid-template-columns: 400px 150px 150px 150px;
}

.digital-scoreboard.fullscreen-version .scoreboard-row {
  padding: 36px 60px;
  grid-template-columns: 400px 150px 150px 150px;
}

.digital-scoreboard.fullscreen-version .row-sets,
.digital-scoreboard.fullscreen-version .row-games,
.digital-scoreboard.fullscreen-version .row-points {
  font-size: 64px;
}

.digital-scoreboard.fullscreen-version .row-player .player-name {
  font-size: 32px;
}

.digital-scoreboard.fullscreen-version .header-player,
.digital-scoreboard.fullscreen-version .header-sets,
.digital-scoreboard.fullscreen-version .header-games,
.digital-scoreboard.fullscreen-version .header-points {
  font-size: 20px;
}

.digital-scoreboard.fullscreen-version .serve-indicator {
  font-size: 32px;
}

/* 投屏旋转90度 */
.fullscreen-tab-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.rotated-scoreboard {
  transform: rotate(90deg);
  transform-origin: center center;
  width: 95vh;
  height: 95vw;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: calc(-47.5vw);
  margin-left: calc(-47.5vh);
}

/* 全屏模式下的资料统计样式 */
.fullscreen-page-content .statistics-sub-nav {
  padding: 16px 0;
  background: white;
  border-radius: 8px;
  margin-bottom: 24px;
}

.fullscreen-page-content .statistics-table-container {
  background: white;
  border-radius: 8px;
  padding: 32px;
}

.fullscreen-page-content .stat-row {
  padding: 20px 0;
}

.fullscreen-page-content .stat-value-left,
.fullscreen-page-content .stat-value-right {
  font-size: 20px;
}

.fullscreen-page-content .stat-label-center {
  font-size: 18px;
}

.fullscreen-page-content .category-header {
  font-size: 18px;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.scoreboard-table {
  width: 100%;
}

.scoreboard-header {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr) 60px 80px;
  gap: 8px;
  padding: 12px 8px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  font-size: 14px;
  color: #64748b;
}

.header-name {
  text-align: left;
}

.header-set,
.header-sets {
  text-align: center;
}

.scoreboard-row {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr) 60px 80px;
  gap: 8px;
  padding: 12px 8px;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
}

.row-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-score {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  padding: 4px;
}

.row-score.winner-set {
  color: #3b82f6;
  font-weight: 600;
}

.row-sets {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  padding: 8px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
}

.row-sets.winner-sets {
  background: #3b82f6;
  color: white;
}

.row-current-set {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
}

.scoreboard-current-game-row {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr) 60px 80px;
  gap: 8px;
  padding: 12px 8px;
  background: #fff7ed;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  color: #64748b;
}

.current-game-label {
  text-align: left;
  font-weight: 600;
}

.current-game-value,
.current-game-sets,
.current-game-current-set {
  text-align: center;
}

.current-game-current-set {
  color: #f59e0b;
  font-weight: 600;
}

.scoreboard-time-row {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr) 60px 80px;
  gap: 8px;
  padding: 12px 8px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
  color: #64748b;
}

.time-current-set {
  text-align: center;
}

.time-label {
  text-align: left;
}

.time-value,
.time-total {
  text-align: center;
}

.current-set-info {
  margin-top: 16px;
}

/* 数字计分板样式 - 简洁专业风格 */
.digital-scoreboard {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.scoreboard-header {
  display: grid;
  grid-template-columns: 150px 60px 60px 60px;
  gap: 0;
  padding: 10px 12px;
  background: #1e293b;
  border-bottom: 1px solid #0f172a;
  align-items: center;
}

.header-player,
.header-sets,
.header-games,
.header-points {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.header-player {
  text-align: left;
}

.scoreboard-row {
  display: grid;
  grid-template-columns: 150px 60px 60px 60px;
  gap: 0;
  padding: 10px 12px;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  transition: background 0.15s;
  position: relative;
}

.scoreboard-row:last-of-type {
  border-bottom: none;
}

.scoreboard-row:hover {
  background: #f8fafc;
}

.scoreboard-row.serving {
  background: #eff6ff;
}

.scoreboard-row.serving::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #3b82f6;
}

.row-player {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.serve-indicator {
  color: #3b82f6;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  flex-shrink: 0;
}

.row-player .player-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-sets,
.row-games,
.row-points {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0;
  width: 100%;
}

.row-sets {
  color: #3b82f6;
}

.row-games {
  color: #10b981;
}

.row-points {
  color: #f59e0b;
}

.scoreboard-footer {
  display: grid;
  grid-template-columns: 150px 60px 60px 60px;
  gap: 0;
  padding: 8px 12px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  align-items: center;
}

.scoreboard-footer span {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
}

.scoreboard-footer span:first-child {
  text-align: left;
}

/* WTA风格得分榜样式（保留备用） */
.wta-scoreboard {
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.wta-header {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr) 1.5fr;
  gap: 8px;
  padding: 12px 16px;
  background: #1e3a8a;
  color: white;
  font-weight: 600;
  font-size: 13px;
  border-radius: 8px 8px 0 0;
  text-align: center;
}

.wta-header-player {
  text-align: left;
}

.wta-header-set {
  text-align: center;
  font-size: 12px;
}

.wta-header-set.current-set-header {
  color: #93c5fd;
  font-weight: 700;
}

.wta-header-game,
.wta-header-point {
  text-align: center;
  font-size: 12px;
}

.wta-row {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  align-items: center;
  background: white;
  transition: background 0.2s;
  border-bottom: 1px solid #e2e8f0;
}

.wta-row:last-child {
  border-bottom: none;
}

.wta-row.current-server {
  background: #f0f9ff;
  border-left: 3px solid #3b82f6;
}

.wta-row.winner-row {
  background: #eff6ff;
}

.wta-player {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-name {
  flex: 1;
}

.server-dot {
  color: #f59e0b;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

.wta-set-score {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.wta-set-score.current-set {
  color: #3b82f6;
  font-weight: 700;
  font-size: 18px;
}

.tiebreak-score-inline {
  font-size: 12px;
  color: #f59e0b;
  margin-left: 2px;
}

.wta-game-score {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #059669;
  line-height: 1.4;
}

.wta-point-score {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
  line-height: 1.4;
}

.game-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 16px;
}

.wta-player {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  min-width: 0;
}

.player-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-indicator {
  color: #f59e0b;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  background: #fff7ed;
  border-radius: 4px;
  margin-left: 4px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.wta-sets,
.wta-games,
.wta-points {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.wta-sets {
  color: #3b82f6;
  font-size: 18px;
}

.wta-games {
  color: #059669;
  font-size: 17px;
}

.wta-points {
  color: #dc2626;
  font-size: 16px;
}

.wta-tiebreak {
  padding: 12px 16px;
  background: #fff7ed;
  border-top: 2px solid #f59e0b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tiebreak-label {
  font-weight: 600;
  color: #f59e0b;
  font-size: 14px;
}

.tiebreak-score {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #dc2626;
}

.tiebreak-server {
  font-size: 12px;
  color: #64748b;
}

/* 历史盘分 */
.sets-history {
  margin-top: 16px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
}

.sets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.set-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.set-item.winner-set {
  border-color: #3b82f6;
  background: #eff6ff;
}

.set-number {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.set-score {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.tiebreak-badge {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 6px;
  background: #f59e0b;
  color: white;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.set-winner {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 500;
}

/* 顶部实时比分 */
.match-score-current {
  font-size: 16px;
  color: #059669;
  font-weight: 600;
  margin-top: 4px;
}

.match-score-tiebreak {
  font-size: 14px;
  color: #f59e0b;
  font-weight: 600;
  margin-top: 4px;
}

.current-games {
  font-size: 16px;
  color: #059669;
}

/* 选手操作按钮组 */
.player-actions {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: white;
  border-top: 1px solid #e2e8f0;
  max-height: 200px; /* 限制最大高度，避免遮挡 */
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.player-action-group {
  margin-bottom: 10px;
}

.player-action-group:last-child {
  margin-bottom: 0;
}

.player-action-title {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
  padding-left: 2px;
}

.player-action-buttons {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
  color: #64748b;
  min-height: 48px; /* 减小高度 */
}

.action-btn:active:not(.disabled) {
  transform: scale(0.95);
  background: #f1f5f9;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn .van-icon {
  font-size: 16px; /* 减小图标 */
  margin-bottom: 2px;
}

.action-btn span {
  font-size: 10px; /* 减小字体 */
  text-align: center;
  line-height: 1.2;
}

.btn-score {
  color: #3b82f6;
}

.btn-score .van-icon {
  color: #3b82f6;
}

.btn-ace {
  color: #f59e0b;
}

.btn-ace .van-icon {
  color: #f59e0b;
}

.btn-double-fault {
  color: #ef4444;
}

.btn-double-fault .van-icon {
  color: #ef4444;
}

.btn-serve-out,
.btn-return-out {
  color: #dc2626;
}

.btn-serve-out .van-icon,
.btn-return-out .van-icon {
  color: #dc2626;
}

.btn-undo {
  color: #64748b;
}

.btn-undo .van-icon {
  color: #64748b;
}

.btn-first-fault {
  color: #f59e0b;
}

.btn-first-fault .van-icon {
  color: #f59e0b;
}

.btn-golden-point {
  color: #fbbf24;
  background: #fef3c7;
}

.btn-golden-point .van-icon {
  color: #fbbf24;
}

.btn-golden-point.not-available {
  opacity: 0.4;
  cursor: not-allowed;
}

.golden-point-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #fbbf24;
  color: #78350f;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.serve-state-indicator {
  display: inline-block;
  padding: 2px 6px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.common-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.common-actions .action-btn {
  width: 100%;
  grid-column: 1 / -1;
  min-height: 44px; /* 撤销按钮稍大一点 */
}
</style>
