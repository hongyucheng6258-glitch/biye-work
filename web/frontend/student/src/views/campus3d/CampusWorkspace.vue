<template>
  <div class="workspace-layer" role="presentation" @click.self="close">
    <section ref="dialog" class="workspace-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown.escape.prevent="close">
      <header class="workspace-header">
        <div class="workspace-heading">
          <span class="workspace-symbol" :style="{ color: item.color, background: `${item.color}16` }">{{ iconGlyph }}</span>
          <div>
            <span class="workspace-breadcrumb">{{ groupName }} · {{ item.room }}</span>
            <h2 :id="titleId">{{ item.name }}</h2>
          </div>
          <span class="workspace-live"><i></i>学生端实时数据</span>
        </div>
        <button ref="closeButton" class="workspace-close" type="button" @click="close">
          <span aria-hidden="true">←</span>返回房间 <kbd>Esc</kbd>
        </button>
      </header>

      <div class="workspace-body">
        <div v-if="authRequired" class="workspace-auth">
          <strong>登录后即可使用此项服务</strong>
          <span>内容仍然来自学生端，登录后会保留当前房间。</span>
          <button type="button" class="workspace-primary" @click="goLogin">前往登录</button>
        </div>

        <div v-else-if="loading" class="workspace-state"><span class="loader-ring"></span><strong>正在同步学生端数据</strong><span>请稍候，马上就好</span></div>
        <div v-else-if="error" class="workspace-state workspace-error"><strong>内容暂时无法加载</strong><p>{{ error }}</p><button type="button" class="workspace-primary" @click="load">重新加载</button></div>

        <template v-else>
          <section v-if="serviceId === 'portal'" class="portal-board">
            <div class="portal-welcome">
              <div><span class="workspace-kicker">学生端数据 · 综合门户</span><h1>校园生活，从这里开始。</h1><p>活动、公告和你的校园进度，都从学生端实时同步。</p></div>
              <div class="portal-orb" aria-hidden="true">◆</div>
            </div>
            <div class="portal-stats">
              <div><span>近期活动</span><strong>{{ portalData.activities.length }}</strong><small>条</small></div>
              <div><span>闲置物品</span><strong>{{ portalData.idleItems.length }}</strong><small>件</small></div>
              <div><span>失物信息</span><strong>{{ portalData.lostFounds.length }}</strong><small>条</small></div>
              <div><span>公告提醒</span><strong>{{ portalNotices.length }}</strong><small>条</small></div>
            </div>
            <div class="portal-columns">
              <section><div class="workspace-section-title"><h3>校园正在发生</h3><span>实时接口</span></div><button v-for="notice in portalNotices" :key="notice.id" class="portal-row" type="button" @click="openNotice(notice)"><span>{{ formatDate(notice.publishTime || notice.createTime || notice.date) }}</span><strong>{{ notice.title }}</strong><b>→</b></button><p v-if="!portalNotices.length" class="workspace-empty">暂无公告</p></section>
              <section><div class="workspace-section-title"><h3>下一场活动</h3><span>学生端活动</span></div><button v-for="activity in portalData.activities.slice(0, 3)" :key="activity.id" class="portal-row portal-event" type="button" @click="openDetail(activity)"><span class="portal-event-media"><img v-if="firstImage(activity)" :src="firstImage(activity)" :alt="activity.title" @error="markImageError(activity, firstImage(activity))"><WtEventArt v-else :item="activity" /></span><span>{{ formatDate(activity.startTime) }}</span><strong>{{ activity.title }}</strong><b>{{ activity.location || '地点待定' }}</b></button><p v-if="!portalData.activities.length" class="workspace-empty">暂无活动</p></section>
            </div>
          </section>

          <section v-else-if="serviceId === 'aichat'" class="ai-board">
            <aside class="ai-prompts"><span class="ai-mark">✦</span><h3>学习路上，多一种思考方式</h3><p>选择一个问题，体验学生端 AI 答疑。</p><button v-for="prompt in quickPrompts" :key="prompt" type="button" @click="question = prompt; sendAi()">{{ prompt }}</button></aside>
            <div class="ai-chat"><div class="ai-chat-head"><strong>学习助手</strong><span>学生端会话</span></div><div ref="aiHistory" class="ai-history"><div v-if="!messages.length" class="workspace-empty">还没有会话，写下你的问题吧。</div><div v-for="(message, index) in messages" :key="index" class="ai-bubble" :class="{ mine: message.role === 'user' }">{{ message.content }}</div></div><form class="ai-input" @submit.prevent="sendAi"><input v-model="question" maxlength="1000" placeholder="输入学习问题…"><button class="workspace-primary" type="submit" :disabled="asking">{{ asking ? '生成中…' : '发送' }}</button></form></div>
          </section>

          <section v-else-if="serviceId === 'code'" class="code-board">
            <div class="code-controls"><label>语言<select v-model="codeLanguage"><option v-for="language in languages" :key="language" :value="language">{{ language }}</option></select></label><button class="workspace-primary" type="button" :disabled="fixing" @click="runCodeFix">{{ fixing ? '分析中…' : '演示代码修复' }}</button></div>
            <div class="code-grid"><label class="code-panel"><span><b>待检查的代码</b><small>{{ codeLanguage }}</small></span><textarea v-model="codeInput" spellcheck="false"></textarea></label><section class="code-panel"><span><b>修复结果</b><small>学生端 AI</small></span><pre v-if="codeResult">{{ codeResult }}</pre><div v-else class="workspace-empty">输入代码后点击“演示代码修复”</div></section></div>
          </section>

          <section v-else-if="serviceId === 'wrong'" class="list-board">
            <div class="workspace-toolbar"><div><span class="workspace-kicker">AI 学习 · C103</span><h1>让每一次出错，都有收获</h1><p>错题数据直接来自学生端错题本。</p></div><input v-model="keyword" placeholder="搜索错题" @keyup.enter="resetAndLoad"></div>
            <div class="workspace-list"><article v-for="row in records" :key="row.id" class="workspace-card is-clickable" role="button" tabindex="0" @click="openCard(row)" @keydown.enter="openCard(row)"><div class="card-top"><span class="card-tag">{{ row.subject || '错题' }}</span><small>{{ row.chapter || row.knowledgePoints || '待复习' }}</small></div><h3>{{ row.title || row.question }}</h3><p>{{ row.question }}</p><div class="card-actions"><button class="workspace-secondary" type="button" @click.stop="toggleDetail(row)">{{ detailId === row.id ? '收起解析' : '查看解析' }}</button><button class="workspace-primary small" type="button" @click.stop="reviewWrong(row)">开始复习</button></div><div v-if="detailId === row.id" class="card-detail"><strong>答案与解析</strong><p>{{ row.analysis || row.correctAnswer || '暂无解析' }}</p></div></article></div><p v-if="!records.length" class="workspace-empty">暂无错题数据</p><nav v-if="pageCount > 1" class="workspace-pagination" aria-label="错题分页"><button type="button" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button><span>第 {{ page }} / {{ pageCount }} 页</span><button type="button" :disabled="page >= pageCount" @click="changePage(page + 1)">下一页</button></nav>
          </section>

          <section v-else-if="serviceId === 'activity' && activityDetailOpen" class="activity-detail-board">
            <div class="activity-detail-toolbar"><button type="button" class="workspace-secondary" @click="closeActivityDetail">← 返回活动列表</button><span>学生端活动详情 · 房间内查看</span></div>
            <div v-if="activityDetailLoading" class="workspace-state"><span class="loader-ring"></span><strong>正在加载活动详情</strong><span>同步学生端内容</span></div>
            <div v-else-if="activityDetailRecord" class="activity-detail-layout">
              <article class="activity-detail-main">
                <div class="activity-detail-hero"><img v-if="firstImage(activityDetailRecord)" :src="firstImage(activityDetailRecord)" :alt="activityDetailRecord.title" @error="markImageError(activityDetailRecord, firstImage(activityDetailRecord))"><WtEventArt v-else :item="activityDetailRecord" large /></div>
                <div class="activity-detail-copy"><div class="activity-detail-tags"><span class="card-tag">{{ activityDetailRecord.category || '校园活动' }}</span><span class="activity-status">{{ activityStatusText(activityDetailRecord) }}</span></div><h1>{{ activityDetailRecord.title }}</h1><p class="activity-detail-subtitle">{{ activityDetailRecord.subtitle || '和校园里的同伴，一起做喜欢的事。' }}</p><div class="activity-detail-host"><span class="host-avatar">{{ (activityDetailRecord.publisherNickname || '梧').charAt(0) }}</span><span><b>{{ activityDetailRecord.publisherNickname || '校园同学' }}</b><small>活动发起方</small></span><button type="button" class="workspace-secondary" @click="goActivityUser(activityDetailRecord.userId)">查看主页</button></div><section class="activity-description"><h2>关于这次相遇</h2><p>{{ activityDetailRecord.description || '暂无活动介绍' }}</p><h3>参加前的小提醒</h3><ul><li>报名后请关注审核结果，活动前再次确认地点与时间。</li><li>活动前请再次确认地点与时间，并提前到达。</li><li>如有疑问，可以联系活动发起方。</li></ul><div class="detail-actions"><button type="button" class="workspace-secondary" @click="toggleActivityFavorite">{{ activityFavorited ? '★ 已收藏' : '☆ 收藏' }}</button><button type="button" class="workspace-secondary" @click="contactActivityPublisher">联系发布者</button><button type="button" class="workspace-secondary" @click="activityReportVisible = true">举报内容</button></div></section></div>
              </article>
              <aside class="activity-ticket"><div class="ticket-heading"><span>我的活动通行证</span><b>▣</b></div><div class="ticket-date"><strong>{{ activityDetailRecord.startTime ? String(activityDetailRecord.startTime).slice(8, 10).replace(/^0/, '') : '新' }}</strong><span>{{ activityDetailRecord.startTime ? `${Number(String(activityDetailRecord.startTime).slice(5, 7))} 月` : '校园' }}<small>{{ activityDetailRecord.startTime ? String(activityDetailRecord.startTime).slice(11, 16) : '待定' }} 开始</small></span></div><div class="ticket-fact"><span>⌖</span><span><small>活动地点</small><b>{{ activityDetailRecord.location || '地点待定' }}</b></span></div><div class="ticket-fact"><span>♧</span><span><small>报名名额</small><b>{{ activityDetailRecord.memberCount || 0 }}{{ activityDetailRecord.maxMembers ? ` / ${activityDetailRecord.maxMembers}` : '' }} 人</b></span></div><div class="activity-progress"><i :style="{ width: `${activityCapacityPercent(activityDetailRecord)}%` }"></i></div><p class="ticket-hint">{{ activityTicketHint(activityDetailRecord) }}</p><div class="activity-actions"><button v-if="activitySignupState(activityDetailRecord) === 'none' || activitySignupState(activityDetailRecord) === 'rejected'" type="button" class="workspace-primary" :disabled="activityDetailRecord.canSignup === false" @click="openActivitySignup">{{ activityDetailRecord.canSignup === false ? (activityDetailRecord.signupDisabledReason || '不可报名') : '立即报名' }}</button><span v-else-if="activitySignupState(activityDetailRecord) === 'pending'" class="activity-ticket-tag pending">报名待审批</span><span v-else class="activity-ticket-tag approved">已通过报名{{ activityDetailRecord.signedIn ? '（已签到）' : '' }}</span><button v-if="activitySignupState(activityDetailRecord) === 'pending' || activitySignupState(activityDetailRecord) === 'approved'" type="button" class="workspace-secondary" :disabled="activityDetailRecord.signedIn || activityCancelBusy" @click="cancelActivitySignupFromDetail">{{ activityDetailRecord.signedIn ? '已签到不可取消' : (activityCancelBusy ? '处理中…' : '取消报名') }}</button></div><small class="ticket-note">报名通过后，可在「我的报名」完成签到</small></aside>
            </div>
            <div v-if="activitySignupVisible" class="activity-signup-layer" @click.self="activitySignupVisible = false"><form class="activity-signup-dialog" @submit.prevent="confirmActivitySignup"><button type="button" class="activity-signup-close" aria-label="关闭报名窗口" @click="activitySignupVisible = false">×</button><span class="workspace-kicker">报名活动</span><h2>{{ activityDetailRecord?.title }}</h2><p>填写报名说明或组队信息，提交后等待发布者审批。</p><textarea v-model="activitySignupRemark" rows="4" maxlength="255" placeholder="报名说明/组队信息（如：计科2201张三，求组队）"></textarea><div class="activity-signup-actions"><button type="button" class="workspace-secondary" @click="activitySignupVisible = false">取消</button><button type="submit" class="workspace-primary" :disabled="activitySignupBusy">{{ activitySignupBusy ? '提交中…' : '确认报名' }}</button></div></form></div>
            <el-dialog v-model="activityReportVisible" title="举报该活动" width="440px" append-to-body><el-select v-model="activityReportReasonType" style="width:100%;margin-bottom:10px"><el-option label="虚假/欺诈信息" value="欺诈" /><el-option label="违规内容" value="违规" /><el-option label="广告骚扰" value="广告" /><el-option label="其他" value="其他" /></el-select><el-input v-model="activityReportReason" type="textarea" :rows="3" maxlength="500" placeholder="补充说明（可空）" /><template #footer><el-button @click="activityReportVisible = false">取消</el-button><el-button type="primary" :loading="activityReportBusy" @click="submitActivityReport">提交举报</el-button></template></el-dialog>
          </section>

          <section v-else class="list-board">
            <div class="workspace-toolbar"><div><span class="workspace-kicker">{{ groupName }} · {{ item.room }}</span><h1>{{ item.name }}</h1><p>{{ profile.prompt }} · 数据与学生端保持同步。</p></div><div class="toolbar-actions"><div v-if="categories.length" class="workspace-tabs"><button v-for="tab in categories" :key="tab" type="button" :class="{ active: category === tab }" @click="selectCategory(tab)">{{ tab }}</button></div><div class="toolbar-inputs"><input v-if="supportsSearch" v-model="keyword" :placeholder="searchPlaceholder" @keyup.enter="resetAndLoad"><button v-if="serviceId === 'message'" type="button" class="workspace-secondary" @click="readAllMessages">全部已读</button></div></div></div>
            <div class="workspace-list"><article v-for="row in records" :key="row.id" class="workspace-card is-clickable" role="button" tabindex="0" @click="openCard(row)" @keydown.enter="openCard(row)">
              <div v-if="['activity', 'idle', 'lost'].includes(serviceId)" class="workspace-card-cover" :class="`cover-${serviceId}`">
                <img v-if="firstImage(row)" :src="firstImage(row)" :alt="cardTitle(row)" @error="markImageError(row, firstImage(row))">
                <WtEventArt v-else-if="serviceId === 'activity'" :item="row" />
                <div v-else class="workspace-image-placeholder"><span aria-hidden="true">▧</span><small>{{ serviceId === 'idle' ? '闲置物品' : '失物信息' }}</small></div>
              </div>
              <div v-if="serviceId === 'square' && imagesOf(row).length" class="workspace-post-images">
                <img v-for="image in imagesOf(row).slice(0, 3)" :key="image" :src="image" :alt="cardTitle(row)" @error="markImageError(row, image)">
              </div>
               <div class="card-top"><span class="card-tag">{{ cardTag(row) }}</span><small>{{ cardMeta(row) }}</small></div><h3>{{ cardTitle(row) }}</h3><p>{{ cardSummary(row) }}</p><div class="card-footer"><span>{{ cardFoot(row) }}</span><div class="card-actions"><button class="workspace-secondary" type="button" @click.stop="serviceId === 'activity' ? openActivityDetail(row) : openCard(row)">{{ detailId === row.id ? '收起详情' : '查看详情' }}</button><button v-if="serviceId === 'activity'" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click.stop="openActivityDetail(row, activitySignupState(row) === 'none' || activitySignupState(row) === 'rejected')">{{ activitySignupLabel(row) }}</button><button v-if="serviceId === 'idle'" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click.stop="openIdleAppointment(row)">预约互换</button><button v-if="serviceId === 'lost' && row.type === 1 && Number(row.status) === 0 && !isOwnRow(row)" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click.stop="openLostClaim(row)">申请认领</button><button v-if="serviceId === 'square'" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click.stop="toggleLike(row)">{{ row.liked ? '取消点赞' : '点赞' }}</button><button v-if="serviceId === 'message' && !row.isRead" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click.stop="readMessage(row)">标为已读</button></div></div><div v-if="detailId === row.id" class="card-detail"><div v-if="firstImage(row)" class="card-detail-image"><img :src="firstImage(row)" :alt="cardTitle(row)" @error="markImageError(row, firstImage(row))"></div><WtEventArt v-else-if="serviceId === 'activity'" :item="row" large /><strong>{{ detailTitle(row) }}</strong><p>{{ detailText(row) }}</p><div v-if="serviceId === 'partner' && !isOwnRow(row)" class="detail-actions"><button class="workspace-primary small" type="button" @click.stop="contactPartner(row)">联系同学</button></div><div v-if="serviceId === 'lost' && row.type === 1 && Number(row.status) === 0 && !isOwnRow(row)" class="detail-actions"><button class="workspace-primary small" type="button" @click.stop="openLostClaim(row)">申请认领</button></div><div v-if="serviceId === 'qa'" class="detail-sublist"><div class="detail-actions"><button class="workspace-secondary" type="button" :disabled="qaAiLoading" @click.stop="askQuestionAi(row)">{{ qaAiLoading ? 'AI 思考中…' : '让 AI 参考回答' }}</button></div><p v-if="qaAiText" class="qa-ai-text">{{ qaAiText }}</p><b v-if="detailAnswers.length">已有回答（{{ detailAnswers.length }}）</b><div v-for="answer in detailAnswers" :key="answer.id" class="qa-answer"><p>{{ answer.answererNickname || '同学' }}：{{ answer.content }}</p><button v-if="detailRecord?.isOwner && detailRecord?.status === 0 && answer.isAccepted !== 1" type="button" class="workspace-secondary" @click.stop="acceptQuestionAnswer(answer, row)">采纳为最佳回答</button></div></div><div v-if="serviceId === 'square'" class="detail-sublist"><div class="detail-actions"><button class="workspace-secondary" type="button" @click.stop="togglePostFavorite(row)">{{ row.favorited ? '★ 已收藏' : '☆ 收藏' }}</button><button class="workspace-secondary" type="button" @click.stop="sharePostInRoom(row)">🔗 分享</button><button class="workspace-secondary" type="button" @click.stop="contactPostAuthor(row)">私信作者</button><button class="workspace-secondary" type="button" @click.stop="openPostReport(row)">举报</button></div><b v-if="detailComments.length">评论（{{ detailComments.length }}）</b><p v-for="comment in detailComments" :key="comment.id">{{ comment.nickname || comment.userNickname || '同学' }}：{{ comment.content }}</p></div><form v-if="serviceId === 'qa'" class="inline-form" @submit.prevent="submitAnswer(row)"><input v-model="answerText[row.id]" placeholder="写下你的回答…" required><button class="workspace-primary small" type="submit">提交回答</button></form><form v-if="serviceId === 'square'" class="inline-form" @submit.prevent="submitComment(row)"><input v-model="commentText[row.id]" placeholder="写一条评论…" required><button class="workspace-primary small" type="submit">发表评论</button></form></div></article></div><p v-if="!records.length" class="workspace-empty">暂无符合条件的数据</p><nav v-if="pageCount > 1" class="workspace-pagination" aria-label="内容分页"><button type="button" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button><span>第 {{ page }} / {{ pageCount }} 页</span><button type="button" :disabled="page >= pageCount" @click="changePage(page + 1)">下一页</button></nav></section>
        </template>

        <el-dialog v-model="idleAppointmentVisible" title="发起预约互换" width="440px" append-to-body>
          <p class="dialog-tip">给发布者留言，说明交换方式、时间和地点。</p>
          <el-input v-model="idleAppointmentMessage" type="textarea" :rows="4" maxlength="255" placeholder="给卖家留言（交换方式、时间地点等）" />
          <template #footer><el-button @click="idleAppointmentVisible = false">取消</el-button><el-button type="primary" :loading="idleAppointmentBusy" @click="confirmIdleAppointment">确认预约</el-button></template>
        </el-dialog>

        <el-dialog v-model="lostClaimVisible" title="申请认领" width="440px" append-to-body>
          <p class="dialog-tip">请填写物品特征说明和联系方式，发布者核实后会与你联系。</p>
          <el-input v-model="lostClaimMessage" type="textarea" :rows="3" maxlength="255" placeholder="物品特征/证明信息…" />
          <el-input v-model="lostClaimContact" maxlength="64" placeholder="联系方式（手机/微信/QQ）" style="margin-top:10px" />
          <template #footer><el-button @click="lostClaimVisible = false">取消</el-button><el-button type="primary" :loading="lostClaimBusy" @click="confirmLostClaim">提交申请</el-button></template>
        </el-dialog>

        <el-dialog v-model="wrongReviewVisible" title="错题详情 · 复习" width="560px" append-to-body>
          <div v-if="wrongReviewRecord" class="wrong-review-dialog">
            <div class="wrong-review-question"><b>题目</b><p>{{ wrongReviewRecord.question }}</p><img v-if="wrongReviewRecord.questionImage" :src="wrongReviewRecord.questionImage" alt="题目图片"></div>
            <div class="wrong-review-answer"><b>正确答案与解析</b><p>我的答案：{{ wrongReviewRecord.myAnswer || '未填写' }}</p><p>正确答案：{{ wrongReviewRecord.correctAnswer || '暂无' }}</p><p>{{ wrongReviewRecord.analysis || '暂无解析' }}</p></div>
            <b>本次复习反馈</b><el-input v-model="wrongReviewAnswer" type="textarea" :rows="2" placeholder="本次作答（可选）" style="margin:8px 0 12px" />
            <div class="wrong-levels"><button v-for="level in wrongReviewLevels" :key="level.value" type="button" :class="{ active: wrongReviewLevel === level.value }" @click="wrongReviewLevel = level.value"><span>{{ level.icon }}</span><strong>{{ level.label }}</strong><small>{{ level.desc }}</small></button></div>
          </div>
          <template #footer><el-button @click="wrongReviewVisible = false">关闭</el-button><el-button type="primary" :loading="wrongReviewBusy" @click="confirmWrongReview">提交复习反馈</el-button></template>
        </el-dialog>

        <el-dialog v-model="postReportVisible" title="举报该动态" width="440px" append-to-body>
          <el-select v-model="postReportReasonType" style="width:100%;margin-bottom:10px"><el-option label="违规内容" value="违规" /><el-option label="辱骂引战" value="辱骂" /><el-option label="广告骚扰" value="广告" /><el-option label="其他" value="其他" /></el-select>
          <el-input v-model="postReportReason" type="textarea" :rows="3" maxlength="500" placeholder="补充说明（可空）" />
          <template #footer><el-button @click="postReportVisible = false">取消</el-button><el-button type="primary" :loading="postReportBusy" @click="submitPostReport">提交举报</el-button></template>
        </el-dialog>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { useMessageStore } from '../../store/message'
import { homeAggregate, listNotice, noticeDetail } from '../../api/notice'
import { activityDetail as fetchActivityDetail, listActivity, signupActivity, cancelActivitySignup } from '../../api/activity'
import { idleDetail, listIdle, appoint } from '../../api/idle'
import { listPartner } from '../../api/partner'
import { lostFoundDetail, listLostFound, claimLostFound } from '../../api/lostfound'
import { aiAnswer, answerQuestion, acceptAnswer, listQuestion, questionDetail } from '../../api/qa'
import { listComments, listPost, likePost, unlikePost, commentPost } from '../../api/post'
import { listMessage, markAllRead, markRead } from '../../api/message'
import { getWrong, listWrong, submitReview } from '../../api/wrong'
import { submitReport } from '../../api/report'
import { favoriteStatus, favorite, unfavorite } from '../../api/favorite'
import { codeFix, listSessions, createSession, listMessages, chatStream } from '../../api/ai'
import WtEventArt from '../../components/wt/WtEventArt.vue'
import { normalizeImages } from '../../utils/image.mjs'
import { GROUPS, SERVICES, getRoomProfile } from '../../features/campus3d/campus-data.js'
import { startChat } from '../../utils/startChat'

const props = defineProps({ serviceId: { type: String, required: true } })
const emit = defineEmits(['close'])
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()
const dialog = ref(null)
const closeButton = ref(null)
const aiHistory = ref(null)
const loading = ref(false)
const error = ref('')
const authRequired = ref(false)
const records = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 6
const keyword = ref('')
const category = ref('全部')
const detailId = ref(null)
const detailRecord = ref(null)
const detailAnswers = ref([])
const detailComments = ref([])
const qaAiText = ref('')
const qaAiLoading = ref(false)
const postReportVisible = ref(false)
const postReportTarget = ref(null)
const postReportReasonType = ref('违规')
const postReportReason = ref('')
const postReportBusy = ref(false)
const busyId = ref(null)
const answerText = ref({})
const commentText = ref({})
const portalData = ref({ activities: [], idleItems: [], lostFounds: [] })
const portalNotices = ref([])
const messages = ref([])
const sessions = ref([])
const currentSession = ref(null)
const question = ref('')
const asking = ref(false)
const codeLanguage = ref('javascript')
const codeInput = ref('const numbers = [1, 2, 3];\nfor (let i = 0; i <= numbers.length; i++) {\n  console.log(numbers[i]);\n}')
const codeResult = ref('')
const fixing = ref(false)
const imageErrors = ref(new Set())
const activityDetailOpen = ref(false)
const activityDetailLoading = ref(false)
const activityDetailRecord = ref(null)
const activitySignupVisible = ref(false)
const activitySignupRemark = ref('')
const activitySignupBusy = ref(false)
const activityCancelBusy = ref(false)
const activityFavorited = ref(false)
const activityReportVisible = ref(false)
const activityReportReasonType = ref('违规')
const activityReportReason = ref('')
const activityReportBusy = ref(false)
const idleAppointmentVisible = ref(false)
const idleAppointmentRecord = ref(null)
const idleAppointmentMessage = ref('')
const idleAppointmentBusy = ref(false)
const lostClaimVisible = ref(false)
const lostClaimRecord = ref(null)
const lostClaimMessage = ref('')
const lostClaimContact = ref('')
const lostClaimBusy = ref(false)
const wrongReviewVisible = ref(false)
const wrongReviewRecord = ref(null)
const wrongReviewAnswer = ref('')
const wrongReviewLevel = ref(null)
const wrongReviewBusy = ref(false)
const wrongReviewLevels = [
  { value: 0, icon: '😵', label: '完全不会', desc: '需要重新学习' },
  { value: 1, icon: '🤔', label: '有点模糊', desc: '还需要巩固' },
  { value: 2, icon: '🙂', label: '基本掌握', desc: '可以独立完成' },
  { value: 3, icon: '😎', label: '完全掌握', desc: '已经熟练掌握' }
]
const languages = ['javascript', 'python', 'java', 'cpp', 'go', 'sql']
const quickPrompts = ['帮我梳理一周复习计划', '解释一下复合函数求导', '如何开始一个前端项目？']
const serviceMap = new Map(SERVICES.map((service) => [service.id, service]))
const groupMap = new Map(GROUPS.map((group) => [group.id, group]))
const item = computed(() => serviceMap.get(props.serviceId) || SERVICES[0])
const profile = computed(() => getRoomProfile(props.serviceId))
const groupName = computed(() => groupMap.get(item.value.group)?.name || '校园总览')
const titleId = computed(() => `workspace-title-${props.serviceId}`)
const iconGlyph = computed(() => ({ calendar: '▣', bag: '◇', users: '◌', search: '⌕', help: '?', chat: '◍', megaphone: '◁', bell: '♧', spark: '✦', code: '</>', book: '▤', home: '◆' }[item.value.icon] || '◆'))
const supportsSearch = computed(() => !['portal', 'aichat', 'code'].includes(props.serviceId))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const searchPlaceholder = computed(() => ({ activity: '搜索活动或地点', idle: '搜索闲置物品', partner: '搜索学习目标', lost: '搜索物品或地点', qa: '搜索问题', square: '搜索动态', notice: '搜索公告', message: '搜索消息' }[props.serviceId] || '搜索内容'))
const categories = computed(() => ({ activity: ['全部', '学习交流', '体育运动', '文艺娱乐', '志愿服务', '竞赛组队'], idle: ['全部', '教材书籍', '数码电子', '生活用品', '运动器材'], qa: ['全部', '学习经验', '课程作业', '校园生活'], notice: ['全部', '校园事务', '学习资源'], message: ['全部', '系统通知', '互动消息', '审核结果'], wrong: ['全部', '待复习', '已掌握'] }[props.serviceId] || []))

function close() { emit('close') }
function goLogin() { router.push({ path: '/login', query: { redirect: '/campus-3d' } }) }
function requireLogin() { if (userStore.isLoggedIn) return true; authRequired.value = true; return false }
function unwrapList(result) { const list = Array.isArray(result) ? result : (result?.list || result?.records || []); return { list, total: Number(result?.total ?? list.length) } }
function formatDate(value) { if (!value) return '待定'; const text = String(value); return text.length >= 10 ? text.slice(5, 10).replace('-', '/') : text }
function resetState() { loading.value = false; error.value = ''; authRequired.value = false; records.value = []; total.value = 0; page.value = 1; keyword.value = ''; category.value = '全部'; detailId.value = null; detailRecord.value = null; detailAnswers.value = []; detailComments.value = []; qaAiText.value = ''; qaAiLoading.value = false; postReportVisible.value = false; postReportTarget.value = null; postReportReason.value = ''; imageErrors.value = new Set(); activityDetailOpen.value = false; activityDetailLoading.value = false; activityDetailRecord.value = null; activitySignupVisible.value = false; activitySignupRemark.value = ''; activityFavorited.value = false; activityReportVisible.value = false; activityReportReason.value = ''; idleAppointmentVisible.value = false; idleAppointmentRecord.value = null; idleAppointmentMessage.value = ''; lostClaimVisible.value = false; lostClaimRecord.value = null; lostClaimMessage.value = ''; lostClaimContact.value = ''; wrongReviewVisible.value = false; wrongReviewRecord.value = null; wrongReviewAnswer.value = ''; wrongReviewLevel.value = null }
function resetAndLoad() { page.value = 1; detailId.value = null; load() }
function selectCategory(value) { category.value = value; resetAndLoad() }
function changePage(value) { page.value = value; detailId.value = null; load() }

async function loadPortal() {
  const [aggregate, noticeResult] = await Promise.all([homeAggregate(), listNotice({ pageNum: 1, pageSize: 5 })])
  portalData.value = { activities: aggregate?.activities || [], idleItems: aggregate?.idleItems || [], lostFounds: aggregate?.lostFounds || [] }
  portalNotices.value = unwrapList(noticeResult).list
}

async function loadAi() {
  if (!requireLogin()) return
  sessions.value = await listSessions('chat')
  if (!sessions.value.length) { currentSession.value = await createSession({ scene: 'chat', title: '3D校园答疑' }); sessions.value = [currentSession.value] }
  else currentSession.value = sessions.value[0]
  const result = await listMessages(currentSession.value.id, 1, 50)
  messages.value = (result?.list || []).reverse().map((message) => ({ role: message.role, content: message.content }))
}

async function load() {
  resetAuthOnly()
  loading.value = true; error.value = ''
  try {
    if (props.serviceId === 'portal') await loadPortal()
    else if (props.serviceId === 'aichat') await loadAi()
    else if (props.serviceId === 'code') return
    else {
      const params = { pageNum: page.value, pageSize, keyword: keyword.value || undefined }
      const selected = category.value !== '全部' ? category.value : undefined
      let result
      if (props.serviceId === 'activity') result = unwrapList(await listActivity({ ...params, category: selected }))
      if (props.serviceId === 'idle') result = unwrapList(await listIdle({ ...params, category: selected }))
      if (props.serviceId === 'partner') result = unwrapList(await listPartner(params))
      if (props.serviceId === 'lost') result = unwrapList(await listLostFound(params))
      if (props.serviceId === 'qa') result = unwrapList(await listQuestion({ ...params, category: selected }))
      if (props.serviceId === 'square') result = unwrapList(await listPost(params))
      if (props.serviceId === 'notice') result = unwrapList(await listNotice({ ...params, category: selected }))
      if (props.serviceId === 'message') result = unwrapList(await listMessage({ ...params, type: selected }))
      if (props.serviceId === 'wrong') result = unwrapList(await listWrong({ ...params, status: selected === '待复习' ? 0 : selected === '已掌握' ? 1 : undefined }))
      records.value = result?.list || []
      total.value = Number(result?.total ?? records.value.length)
    }
  } catch (err) { error.value = err?.message || '学生端数据加载失败' }
  finally { loading.value = false; nextTick(() => closeButton.value?.focus({ preventScroll: true })) }
}

function resetAuthOnly() { authRequired.value = false }
function cardTitle(row) { return row.title || row.name || row.question || row.content || '校园服务内容' }
function imageKey(row, image) { return `${props.serviceId}:${row?.id ?? cardTitle(row)}:${image}` }
function markImageError(row, image) { if (!image) return; const next = new Set(imageErrors.value); next.add(imageKey(row, image)); imageErrors.value = next }
function imagesOf(row) { return normalizeImages(row).filter((image) => !imageErrors.value.has(imageKey(row, image))) }
function firstImage(row) { return imagesOf(row)[0] || '' }
function activitySignupState(row) {
  const status = row?.mySignupStatus
  if (status === 0 || status === '0') return 'pending'
  if (status === 1 || status === '1') return 'approved'
  if (status === 2 || status === '2' || status === 3 || status === '3') return 'rejected'
  if (row?.signedUp || row?.isSignup || row?.registered || row?.hasSignup) return 'approved'
  return 'none'
}
function activitySignupLabel(row) { const state = activitySignupState(row); return state === 'pending' ? '报名待审批' : state === 'approved' ? '已报名' : '报名参加' }
function activityStatusText(row) { return row?.displayStatusText || (['报名中', '已满', '已结束', '已下架'][Number(row?.status)] || '报名中') }
function activityCapacityPercent(row) { const max = Number(row?.maxMembers); return max ? Math.min(Math.round((Number(row?.memberCount) || 0) / max * 100), 100) : 0 }
function activityTicketHint(row) { const max = Number(row?.maxMembers); if (max && Number(row?.memberCount) >= max) return '当前活动已满员。'; if (Number(row?.status) === 0 || row?.displayStatus === 0) return `还有 ${(max || 99) - (Number(row?.memberCount) || 0)} 个名额，期待你加入。`; return '活动报名通道已关闭。' }
function openCard(row) {
  if (props.serviceId === 'activity') return openActivityDetail(row)
  if (props.serviceId === 'idle') return openIdleDetail(row)
  if (props.serviceId === 'lost') return openLostDetail(row)
  if (props.serviceId === 'qa') return openQuestionDetail(row)
  if (props.serviceId === 'message') readMessage(row)
  return toggleDetail(row)
}
async function openIdleDetail(row) {
  toggleDetail(row)
  if (detailId.value !== row.id) return
  try { const detail = await idleDetail(row.id); if (detailId.value === row.id) detailRecord.value = detail } catch { if (detailId.value === row.id) detailRecord.value = row }
}
async function openLostDetail(row) {
  toggleDetail(row)
  if (detailId.value !== row.id) return
  try { const detail = await lostFoundDetail(row.id); if (detailId.value === row.id) detailRecord.value = detail } catch { if (detailId.value === row.id) detailRecord.value = row }
}
async function openQuestionDetail(row) {
  toggleDetail(row)
  if (detailId.value !== row.id) return
  qaAiText.value = ''
  try {
    const detail = await questionDetail(row.id)
    if (detailId.value === row.id) { detailRecord.value = detail?.question || detail; detailAnswers.value = detail?.answers || [] }
  } catch { if (detailId.value === row.id) { detailRecord.value = row; detailAnswers.value = [] } }
}
async function askQuestionAi(row) { if (!requireLogin() || qaAiLoading.value) return; qaAiLoading.value = true; try { qaAiText.value = await aiAnswer(row.id) } catch (err) { ElMessage.error(err?.message || 'AI 回答失败') } finally { qaAiLoading.value = false } }
async function acceptQuestionAnswer(answer, row) { if (!requireLogin()) return; try { await acceptAnswer(answer.id); ElMessage.success('已采纳该回答，问题标记为已解决'); const detail = await questionDetail(row.id); if (detailId.value === row.id) { detailRecord.value = detail?.question || detail; detailAnswers.value = detail?.answers || [] } } catch (err) { ElMessage.error(err?.message || '采纳失败') } }
async function openActivityDetail(row, autoSignup = false) {
  activityDetailOpen.value = true
  activityDetailLoading.value = true
  activityDetailRecord.value = row
  activityFavorited.value = false
  try {
    // 列表接口已经包含公开详情；登录后再补充学生端详情中的报名状态。
    if (userStore.isLoggedIn) {
      const detail = await fetchActivityDetail(row.id)
      activityDetailRecord.value = { ...row, ...detail }
      try { activityFavorited.value = await favoriteStatus('activity', row.id) } catch { activityFavorited.value = false }
    }
  } catch (err) {
    ElMessage.error(err?.message || '活动详情加载失败')
  } finally {
    activityDetailLoading.value = false
    if (autoSignup && activitySignupState(activityDetailRecord.value) === 'none') openActivitySignup()
  }
}
function closeActivityDetail() { activitySignupVisible.value = false; activityDetailOpen.value = false; activityDetailRecord.value = null }
function goActivityUser(id) { if (!id) return; if (Number(id) === Number(userStore.userInfo?.id)) router.push('/profile'); else router.push(`/user/${id}`) }
async function contactActivityPublisher() { const row = activityDetailRecord.value; if (!row) return; await startChat(router, userStore, row.userId, { type: 'activity', id: row.id, title: row.title }) }
async function toggleActivityFavorite() { const row = activityDetailRecord.value; if (!row?.id) return; if (!requireLogin()) return; try { if (activityFavorited.value) { await unfavorite('activity', row.id); activityFavorited.value = false; ElMessage.success('已取消收藏') } else { await favorite('activity', row.id); activityFavorited.value = true; ElMessage.success('收藏成功') } } catch (err) { ElMessage.error(err?.message || '收藏操作失败') } }
async function submitActivityReport() { const row = activityDetailRecord.value; if (!row?.id) return; if (!requireLogin()) return; activityReportBusy.value = true; try { await submitReport({ targetType: 'activity', targetId: row.id, reasonType: activityReportReasonType.value, reason: activityReportReason.value.trim() }); ElMessage.success('举报已提交'); activityReportVisible.value = false; activityReportReason.value = '' } catch (err) { ElMessage.error(err?.message || '举报失败') } finally { activityReportBusy.value = false } }
function openActivitySignup() { const row = activityDetailRecord.value; if (!row) return; if (row.canSignup === false) { ElMessage.warning(row.signupDisabledReason || '当前活动暂不可报名'); return } activitySignupRemark.value = ''; activitySignupVisible.value = true }
async function refreshActivityDetail() {
  const row = activityDetailRecord.value
  if (!row?.id) return
  try {
    const detail = await fetchActivityDetail(row.id)
    activityDetailRecord.value = { ...row, ...detail }
    records.value = records.value.map((item) => item.id === row.id ? { ...item, ...detail } : item)
  } catch (err) { ElMessage.error(err?.message || '活动状态刷新失败') }
}
async function confirmActivitySignup() {
  if (!userStore.isLoggedIn) { goLogin(); return }
  const row = activityDetailRecord.value
  if (!row?.id || activitySignupBusy.value) return
  activitySignupBusy.value = true
  try {
    await signupActivity(row.id, { remark: activitySignupRemark.value.trim() })
    ElMessage.success('报名已提交，等待发布者审批')
    activitySignupVisible.value = false
    await refreshActivityDetail()
    await load()
  } catch (err) { ElMessage.error(err?.message || '报名失败') } finally { activitySignupBusy.value = false }
}
async function cancelActivitySignupFromDetail() {
  const row = activityDetailRecord.value
  if (!row?.id || activityCancelBusy.value) return
  try { await ElMessageBox.confirm('确定取消该活动的报名吗？', '取消报名', { type: 'warning' }) } catch { return }
  activityCancelBusy.value = true
  try {
    await cancelActivitySignup(row.id)
    ElMessage.success('已取消报名')
    await refreshActivityDetail()
    await load()
  } catch (err) { ElMessage.error(err?.message || '取消报名失败') } finally { activityCancelBusy.value = false }
}
function cardSummary(row) { return row.description || row.content || row.body || row.question || row.detail || row.intro || '学生端同步内容' }
function cardMeta(row) { return row.category || row.typeName || row.department || row.subject || row.goal || row.statusText || '实时数据' }
function cardTag(row) { if (props.serviceId === 'message') return row.typeName || row.type || '消息'; if (props.serviceId === 'lost') return row.type === 0 || row.type === '寻物' ? '寻物' : '招领'; return row.category || row.subject || item.value.name }
function cardFoot(row) { return row.location || row.place || row.startTime ? `${row.location || row.place || ''}${row.startTime ? ` · ${formatDate(row.startTime)}` : ''}` : row.authorName || row.nickname || row.author || '学生端数据' }
function isOwnRow(row) { return Boolean(row?.isOwner || (row?.userId && Number(row.userId) === Number(userStore.userInfo?.id))) }
function detailTitle(row) { return detailRecord.value?.title || cardTitle(row) }
function detailText(row) { return detailRecord.value?.content || detailRecord.value?.body || row.description || row.content || row.body || row.analysis || row.correctAnswer || '暂无更多详情' }
function toggleDetail(row) { detailId.value = detailId.value === row.id ? null : row.id; detailRecord.value = null; detailAnswers.value = []; detailComments.value = []; if (detailId.value && props.serviceId === 'notice') loadNoticeDetail(row); if (detailId.value && props.serviceId === 'square') loadComments(row) }
async function loadNoticeDetail(row) { try { detailRecord.value = await noticeDetail(row.id) } catch { detailRecord.value = row } }
async function loadComments(row) { try { const result = await listComments(row.id, { pageNum: 1, pageSize: 50 }); if (detailId.value !== row.id) return; detailComments.value = result?.list || []; row.commentCount = Number(result?.total ?? detailComments.value.length) } catch { if (detailId.value === row.id) detailComments.value = [] } }
function openNotice(row) { detailId.value = row.id; detailRecord.value = row; if (props.serviceId !== 'portal') loadNoticeDetail(row) }
function openDetail(row) { detailId.value = row.id; detailRecord.value = row }

function openIdleAppointment(row) { if (!requireLogin()) return; idleAppointmentRecord.value = row; idleAppointmentMessage.value = ''; idleAppointmentVisible.value = true }
async function confirmIdleAppointment() { if (!userStore.isLoggedIn) { goLogin(); return }; const row = idleAppointmentRecord.value; if (!row?.id || idleAppointmentBusy.value) return; idleAppointmentBusy.value = true; try { await appoint(row.id, { message: idleAppointmentMessage.value.trim() }); ElMessage.success('预约已发起，等待卖家确认'); idleAppointmentVisible.value = false; await load() } catch (err) { ElMessage.error(err?.message || '预约失败') } finally { idleAppointmentBusy.value = false } }
async function reserveIdle(row) { openIdleAppointment(row) }
function openLostClaim(row) { if (!requireLogin()) return; lostClaimRecord.value = row; lostClaimMessage.value = ''; lostClaimContact.value = ''; lostClaimVisible.value = true }
async function confirmLostClaim() { if (!userStore.isLoggedIn) { goLogin(); return }; const row = lostClaimRecord.value; if (!row?.id || lostClaimBusy.value) return; if (!lostClaimMessage.value.trim() && !lostClaimContact.value.trim()) { ElMessage.warning('请填写认领说明或联系方式'); return }; lostClaimBusy.value = true; try { await claimLostFound(row.id, { message: lostClaimMessage.value.trim(), contact: lostClaimContact.value.trim() }); ElMessage.success('认领申请已提交，等待发布者核实'); lostClaimVisible.value = false; await load() } catch (err) { ElMessage.error(err?.message || '认领申请失败') } finally { lostClaimBusy.value = false } }
async function contactPartner(row) { await startChat(router, userStore, row.userId, { type: 'partner', id: row.id, title: cardTitle(row) }) }
async function toggleLike(row) { if (!requireLogin()) return; busyId.value = row.id; try { if (row.liked) { await unlikePost(row.id); row.liked = false; row.likeCount = Math.max(0, Number(row.likeCount || 0) - 1) } else { await likePost(row.id); row.liked = true; row.likeCount = Number(row.likeCount || 0) + 1 } } catch (err) { ElMessage.error(err?.message || '点赞失败') } finally { busyId.value = null } }
async function togglePostFavorite(row) { if (!requireLogin()) return; try { if (row.favorited) { await unfavorite('post', row.id); row.favorited = false; ElMessage.success('已取消收藏') } else { await favorite('post', row.id); row.favorited = true; ElMessage.success('收藏成功') } } catch (err) { ElMessage.error(err?.message || '收藏操作失败') } }
async function sharePostInRoom(row) { const url = `${location.origin}${location.pathname}#/social?post=${row.id}`; try { await navigator.clipboard.writeText(url); ElMessage.success('动态链接已复制') } catch { ElMessage.info(`动态链接：${url}`) } }
async function contactPostAuthor(row) { await startChat(router, userStore, row.userId, { type: 'post', id: row.id, title: cardTitle(row) }) }
function openPostReport(row) { if (!requireLogin()) return; postReportTarget.value = row; postReportReason.value = ''; postReportVisible.value = true }
async function submitPostReport() { const row = postReportTarget.value; if (!row?.id) return; postReportBusy.value = true; try { await submitReport({ targetType: 'post', targetId: row.id, reasonType: postReportReasonType.value, reason: postReportReason.value.trim() }); ElMessage.success('举报已提交'); postReportVisible.value = false } catch (err) { ElMessage.error(err?.message || '举报失败') } finally { postReportBusy.value = false } }
async function submitComment(row) { if (!requireLogin()) return; const content = commentText.value[row.id]?.trim(); if (!content) return; busyId.value = row.id; try { await commentPost(row.id, content); commentText.value[row.id] = ''; ElMessage.success('评论已提交'); await loadComments(row) } catch (err) { ElMessage.error(err?.message || '评论失败') } finally { busyId.value = null } }
async function submitAnswer(row) { if (!requireLogin()) return; const content = answerText.value[row.id]?.trim(); if (!content) return; busyId.value = row.id; try { await answerQuestion(row.id, { content }); answerText.value[row.id] = ''; ElMessage.success('回答已提交'); await load() } catch (err) { ElMessage.error(err?.message || '回答失败') } finally { busyId.value = null } }
async function readMessage(row) { if (!requireLogin()) return; busyId.value = row.id; try { await markRead(row.id); row.isRead = 1; messageStore.refreshUnread(); } catch (err) { ElMessage.error(err?.message || '消息操作失败') } finally { busyId.value = null } }
async function readAllMessages() { if (!requireLogin()) return; try { await markAllRead(); records.value.forEach((row) => { row.isRead = 1 }); messageStore.refreshUnread(); ElMessage.success('已全部标记为已读') } catch (err) { ElMessage.error(err?.message || '消息操作失败') } }
async function reviewWrong(row) { if (!requireLogin()) return; wrongReviewRecord.value = row; wrongReviewAnswer.value = ''; wrongReviewLevel.value = null; wrongReviewVisible.value = true; try { wrongReviewRecord.value = await getWrong(row.id) } catch { /* 列表数据足够展示复习入口 */ } }
async function confirmWrongReview() { if (!wrongReviewRecord.value?.id || wrongReviewLevel.value === null || wrongReviewBusy.value) { if (wrongReviewLevel.value === null) ElMessage.warning('请选择掌握程度'); return }; wrongReviewBusy.value = true; try { await submitReview({ wrongQuestionId: wrongReviewRecord.value.id, userAnswer: wrongReviewAnswer.value.trim() || undefined, masteryLevel: wrongReviewLevel.value, isCorrect: wrongReviewLevel.value >= 2 ? 1 : 0 }); ElMessage.success('复习反馈已记录'); wrongReviewVisible.value = false; await load() } catch (err) { ElMessage.error(err?.message || '复习记录提交失败') } finally { wrongReviewBusy.value = false } }

async function sendAi() { if (!requireLogin()) return; const text = question.value.trim(); if (!text || asking.value) return; asking.value = true; question.value = ''; messages.value.push({ role: 'user', content: text }); const answer = { role: 'assistant', content: '' }; messages.value.push(answer); await nextTick(); aiHistory.value?.scrollTo({ top: aiHistory.value.scrollHeight }); try { await chatStream({ sessionId: currentSession.value?.id, question: text }, { onDelta: (delta) => { answer.content += delta; }, onDone: () => {}, onError: (_code, message) => { answer.content = answer.content || `⚠️ ${message}` } }) } catch (err) { answer.content = answer.content || `⚠️ ${err?.message || 'AI服务暂时不可用'}` } finally { asking.value = false; await nextTick(); aiHistory.value?.scrollTo({ top: aiHistory.value.scrollHeight }) } }
async function runCodeFix() { if (!requireLogin()) return; if (!codeInput.value.trim()) return; fixing.value = true; codeResult.value = ''; try { const result = await codeFix({ code: codeInput.value, language: codeLanguage.value, extra: '' }); codeResult.value = typeof result === 'string' ? result : (result?.answer || '暂无纠错结果') } catch (err) { codeResult.value = `⚠️ ${err?.message || '代码纠错失败'}` } finally { fixing.value = false } }

watch(() => props.serviceId, () => { resetState(); load() }, { immediate: true })
onMounted(() => nextTick(() => closeButton.value?.focus({ preventScroll: true })))

</script>

<style scoped>
.workspace-layer { position: absolute; inset: 0; z-index: 42; display: grid; place-items: center; padding: 28px; background: rgba(16, 43, 75, .42); backdrop-filter: blur(10px); }
.workspace-dialog { width: min(1180px, 100%); height: min(850px, 100%); display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,.9); border-radius: 22px; background: var(--surface, #fff); box-shadow: 0 30px 90px rgba(9,38,75,.28); color: var(--ink, #17395e); }
.workspace-header { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px 24px; border-bottom: 1px solid var(--line); background: rgba(255,255,255,.92); }
.workspace-heading { display: flex; align-items: center; gap: 13px; min-width: 0; }
.workspace-symbol { width: 48px; height: 48px; display: grid; place-items: center; flex: none; border-radius: 14px; font-size: 22px; font-weight: 800; }
.workspace-breadcrumb, .workspace-kicker { display: block; color: var(--ink-3, #8298b3); font-size: 11px; }
.workspace-header h2 { margin: 3px 0 0; color: var(--ink, #17395e); font-size: 22px; }
.workspace-live { display: inline-flex; align-items: center; gap: 6px; margin-left: 10px; color: #4b8d7d; font-size: 10px; white-space: nowrap; }
.workspace-live i { width: 7px; height: 7px; border-radius: 50%; background: #44bf9b; }
.workspace-close { display: inline-flex; align-items: center; gap: 7px; flex: none; min-height: 39px; padding: 0 13px; border: 1px solid var(--brand-line); border-radius: 10px; background: var(--surface); color: var(--brand); cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; }
.workspace-close:hover { background: var(--brand-soft); }
.workspace-close kbd { padding: 2px 6px; border: 1px solid var(--line); border-radius: 5px; color: var(--ink-3); font-size: 10px; font-weight: 500; }
.workspace-body { min-height: 0; flex: 1; overflow: auto; padding: 28px 32px 36px; background: linear-gradient(180deg, #fbfdff, #f4f8fd); }
.workspace-state { min-height: 100%; display: grid; place-content: center; justify-items: center; gap: 9px; text-align: center; color: var(--ink-2); }
.workspace-state span:last-child { color: var(--ink-3); font-size: 12px; }.workspace-state p { max-width: 420px; margin: 0; color: var(--ink-3); font-size: 13px; }
.workspace-error { color: #24476c; }.loader-ring { width: 30px; height: 30px; border: 3px solid rgba(40,100,234,.16); border-top-color: var(--brand); border-radius: 50%; animation: campus-workspace-spin .8s linear infinite; }@keyframes campus-workspace-spin { to { transform: rotate(360deg); } }
.workspace-primary, .workspace-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 35px; padding: 0 13px; border-radius: 8px; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; }.workspace-primary { border: 1px solid var(--brand); background: var(--brand); color: #fff; }.workspace-primary:hover { background: var(--brand-strong); }.workspace-primary:disabled { cursor: wait; opacity: .55; }.workspace-primary.small, .workspace-secondary { min-height: 30px; padding: 0 10px; font-size: 11px; }.workspace-secondary { border: 1px solid var(--line); background: #fff; color: var(--brand); }.workspace-secondary:hover { border-color: var(--brand-line); background: var(--brand-soft); }
.workspace-auth { display: grid; place-content: center; justify-items: center; gap: 10px; min-height: 100%; text-align: center; }.workspace-auth span { color: var(--ink-3); font-size: 13px; }
.portal-welcome { display: flex; align-items: center; justify-content: space-between; gap: 30px; padding: 30px 34px; border-radius: 18px; background: linear-gradient(105deg, #eaf3ff, #f7fbff 70%); }.portal-welcome h1, .list-board h1 { margin: 7px 0 9px; color: #17395e; font-size: clamp(25px, 3vw, 36px); letter-spacing: -.8px; }.portal-welcome p, .list-board .workspace-toolbar p { margin: 0; color: var(--ink-3); font-size: 13px; }.portal-orb { width: 85px; height: 85px; display: grid; place-items: center; border-radius: 28px; background: var(--brand); color: #fff; font-size: 28px; box-shadow: 0 14px 30px rgba(40,100,234,.22); }
.portal-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }.portal-stats > div { padding: 17px; border: 1px solid var(--line); border-radius: 13px; background: #fff; }.portal-stats span, .portal-stats small { color: var(--ink-3); font-size: 11px; }.portal-stats strong { margin-left: 12px; color: var(--brand); font-size: 26px; }.portal-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }.portal-columns > section { padding: 20px; border: 1px solid var(--line); border-radius: 15px; background: #fff; }.workspace-section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }.workspace-section-title h3 { color: var(--ink); font-size: 15px; }.workspace-section-title span { color: var(--ink-3); font-size: 10px; }.portal-row { width: 100%; display: grid; grid-template-columns: 57px 1fr auto; gap: 10px; align-items: center; padding: 12px 0; border: 0; border-top: 1px solid var(--line); background: transparent; color: inherit; text-align: left; cursor: pointer; }.portal-row span, .portal-row b { color: var(--ink-3); font-size: 10px; font-weight: 500; }.portal-row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink-2); font-size: 12px; }.portal-row:hover strong, .portal-row:hover b { color: var(--brand); }.portal-event { grid-template-columns: 34px 57px 1fr 80px; }.portal-event b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.portal-event-media { width: 34px; height: 34px; overflow: hidden; border-radius: 9px; background: #edf3fb; }.portal-event-media > img { display: block; width: 100%; height: 100%; object-fit: cover; }.portal-event-media :deep(.event-art) { height: 34px; }.portal-event-media :deep(.event-art-copy) { padding: 5px; }.portal-event-media :deep(.event-art-copy strong) { margin: 0; font-size: 8px; line-height: 1.1; }.portal-event-media :deep(.event-art-copy > span), .portal-event-media :deep(.event-art-copy small) { display: none; }.portal-event-media :deep(.event-graphic) { width: 50px; height: 50px; right: -13px; bottom: -9px; }
.list-board { min-height: 100%; }.workspace-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 21px; }.workspace-toolbar input { width: 220px; min-height: 37px; padding: 0 12px; border: 1px solid var(--line); border-radius: 9px; outline: none; background: #fff; color: var(--ink); font: inherit; font-size: 12px; }.workspace-toolbar input:focus { border-color: var(--brand); }.toolbar-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 9px; }.toolbar-inputs { display: flex; align-items: center; gap: 8px; }.workspace-tabs { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }.workspace-tabs button { padding: 6px 10px; border: 0; border-radius: 7px; background: transparent; color: var(--ink-3); cursor: pointer; font: inherit; font-size: 11px; }.workspace-tabs button.active, .workspace-tabs button:hover { background: var(--brand-soft); color: var(--brand); }
.workspace-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.workspace-card { min-width: 0; padding: 18px; border: 1px solid var(--line); border-radius: 14px; background: #fff; transition: .18s ease; }.workspace-card:hover { border-color: var(--brand-line); box-shadow: 0 8px 22px rgba(30,74,126,.08); }.workspace-card-cover { height: 150px; margin: -18px -18px 15px; overflow: hidden; border-radius: 13px 13px 0 0; background: #edf3fb; }.workspace-card-cover > img { display: block; width: 100%; height: 100%; object-fit: cover; }.workspace-card-cover :deep(.event-art) { height: 150px; }.workspace-image-placeholder { display: grid; place-content: center; justify-items: center; gap: 7px; height: 100%; background: linear-gradient(135deg, #eef5ff, #f8fbff); color: #7190b5; }.workspace-image-placeholder span { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: #dceaff; color: var(--brand); font-size: 22px; }.workspace-image-placeholder small { font-size: 11px; }.workspace-post-images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; height: 128px; margin: -18px -18px 15px; overflow: hidden; border-radius: 13px 13px 0 0; background: #edf3fb; }.workspace-post-images img { display: block; width: 100%; height: 100%; min-width: 0; object-fit: cover; }.workspace-post-images img:only-child { grid-column: 1 / -1; }.card-top, .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.card-tag { padding: 4px 8px; border-radius: 6px; background: var(--brand-soft); color: var(--brand-strong); font-size: 10px; }.card-top small, .card-footer > span { color: var(--ink-3); font-size: 10px; }.workspace-card h3 { margin: 13px 0 7px; color: var(--ink); font-size: 15px; line-height: 1.45; }.workspace-card > p { min-height: 38px; margin: 0; color: var(--ink-3); font-size: 12px; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }.card-footer { margin-top: 15px; }.card-actions { display: flex; align-items: center; gap: 7px; }.card-detail { margin-top: 14px; padding: 13px; border-radius: 10px; background: #f3f7fd; color: var(--ink-2); font-size: 12px; line-height: 1.7; }.card-detail :deep(.event-art) { height: 190px; margin: -13px -13px 13px; border-radius: 10px 10px 0 0; }.card-detail-image { height: 190px; margin: -13px -13px 13px; overflow: hidden; border-radius: 10px 10px 0 0; background: #eaf1fa; }.card-detail-image img { display: block; width: 100%; height: 100%; object-fit: cover; }.card-detail p { margin: 5px 0 0; }.inline-form { display: flex; gap: 7px; margin-top: 10px; }.inline-form input { min-width: 0; flex: 1; min-height: 31px; padding: 0 9px; border: 1px solid var(--line); border-radius: 7px; outline: none; font: inherit; font-size: 11px; }
.workspace-empty { padding: 42px 10px; color: var(--ink-3); text-align: center; font-size: 13px; }.workspace-pagination { display: flex; align-items: center; justify-content: center; gap: 13px; margin-top: 23px; color: var(--ink-3); font-size: 11px; }.workspace-pagination button { min-height: 29px; padding: 0 10px; border: 1px solid var(--line); border-radius: 7px; background: #fff; color: var(--brand); cursor: pointer; font: inherit; }.workspace-pagination button:disabled { cursor: not-allowed; opacity: .4; }
.workspace-card.is-clickable { cursor: pointer; }.workspace-card.is-clickable:focus-visible { outline: 3px solid rgba(40,100,234,.25); outline-offset: 2px; }.detail-actions { display: flex; gap: 8px; margin-top: 11px; flex-wrap: wrap; }.detail-sublist { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); }.detail-sublist p { margin: 5px 0 0; color: var(--ink-2); }.qa-answer { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-top: 1px solid rgba(160,182,207,.35); }.qa-answer p { flex: 1; }.qa-ai-text { margin: 8px 0; padding: 9px 11px; border-radius: 8px; background: var(--brand-soft); white-space: pre-wrap; }.dialog-tip { margin: 0 0 12px; color: var(--ink-2); font-size: 13px; line-height: 1.6; }.wrong-review-dialog { color: var(--ink-2); font-size: 13px; line-height: 1.7; }.wrong-review-question, .wrong-review-answer { margin-bottom: 15px; padding: 12px 14px; border-radius: 10px; background: #f3f7fd; }.wrong-review-question p, .wrong-review-answer p { margin: 5px 0 0; white-space: pre-wrap; }.wrong-review-question img { display: block; max-width: 100%; max-height: 170px; margin-top: 9px; border-radius: 7px; }.wrong-levels { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }.wrong-levels button { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 9px 11px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: var(--ink-2); cursor: pointer; text-align: left; }.wrong-levels button.active, .wrong-levels button:hover { border-color: var(--brand); background: var(--brand-soft); }.wrong-levels span { font-size: 18px; }.wrong-levels strong { font-size: 12px; }.wrong-levels small { color: var(--ink-3); font-size: 10px; }
.activity-detail-board { min-height: 100%; }.activity-detail-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; color: var(--ink-3); font-size: 11px; }.activity-detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 20px; align-items: start; }.activity-detail-main { overflow: hidden; border: 1px solid var(--line); border-radius: 16px; background: #fff; }.activity-detail-hero { height: 280px; overflow: hidden; background: #edf3fb; }.activity-detail-hero > img { display: block; width: 100%; height: 100%; object-fit: cover; }.activity-detail-hero :deep(.event-art) { height: 280px; }.activity-detail-copy { padding: 22px 25px 28px; }.activity-detail-tags { display: flex; align-items: center; gap: 8px; }.activity-status { padding: 4px 8px; border-radius: 6px; background: #e9f8f1; color: #278a68; font-size: 10px; }.activity-detail-copy h1 { margin: 12px 0 7px; color: var(--ink); font-size: 25px; line-height: 1.4; }.activity-detail-subtitle { margin: 0; color: var(--ink-3); font-size: 13px; line-height: 1.7; }.activity-detail-host { display: flex; align-items: center; gap: 9px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }.host-avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--brand-soft); color: var(--brand); font-weight: 700; }.activity-detail-host b, .activity-detail-host small { display: block; }.activity-detail-host b { color: var(--ink-2); font-size: 12px; }.activity-detail-host small { margin-top: 2px; color: var(--ink-3); font-size: 10px; }.activity-description { margin-top: 23px; }.activity-description h2 { margin: 0 0 10px; color: var(--ink); font-size: 18px; }.activity-description h3 { margin: 20px 0 8px; color: var(--ink); font-size: 14px; }.activity-description p, .activity-description li { color: var(--ink-2); font-size: 13px; line-height: 1.9; }.activity-description p { margin: 0; white-space: pre-wrap; }.activity-description ul { margin: 0; padding-left: 18px; }.activity-ticket { position: sticky; top: 0; padding: 22px; border: 1px solid var(--line); border-radius: 16px; background: #fff; box-shadow: 0 10px 28px rgba(30,74,126,.06); }.ticket-heading { display: flex; align-items: center; justify-content: space-between; color: var(--ink-3); font-size: 12px; }.ticket-heading b { color: var(--brand); font-size: 20px; }.ticket-date { display: flex; align-items: center; gap: 14px; margin: 13px 0 20px; }.ticket-date strong { color: var(--brand); font-size: 55px; line-height: 1; }.ticket-date span { color: var(--ink); font-size: 15px; font-weight: 700; }.ticket-date small { display: block; margin-top: 4px; color: var(--ink-3); font-size: 10px; font-weight: 400; }.ticket-fact { display: flex; align-items: center; gap: 10px; margin-top: 16px; color: var(--ink-2); }.ticket-fact > span:first-child { width: 24px; color: var(--ink-3); font-size: 17px; text-align: center; }.ticket-fact small, .ticket-fact b { display: block; }.ticket-fact small { color: var(--ink-3); font-size: 10px; }.ticket-fact b { margin-top: 2px; color: var(--ink); font-size: 13px; }.activity-progress { height: 6px; margin: 17px 0 9px; overflow: hidden; border-radius: 999px; background: var(--surface-2); }.activity-progress i { display: block; height: 100%; border-radius: inherit; background: var(--brand); }.ticket-hint { margin: 0 0 16px; color: var(--ink-3); font-size: 11px; line-height: 1.6; }.activity-actions { display: flex; flex-direction: column; gap: 9px; }.activity-actions > button { width: 100%; min-height: 42px; }.activity-ticket-tag { display: flex; align-items: center; justify-content: center; min-height: 42px; border-radius: 9px; font-size: 12px; font-weight: 700; }.activity-ticket-tag.pending { background: #fff5dd; color: #a97414; }.activity-ticket-tag.approved { background: #e9f8f1; color: #278a68; }.ticket-note { display: block; margin-top: 14px; color: var(--ink-3); font-size: 10px; text-align: center; }.activity-signup-layer { position: absolute; inset: 0; z-index: 4; display: grid; place-items: center; padding: 24px; background: rgba(20,47,80,.28); backdrop-filter: blur(5px); }.activity-signup-dialog { position: relative; width: min(450px, 100%); padding: 25px; border: 1px solid rgba(255,255,255,.9); border-radius: 16px; background: #fff; box-shadow: 0 24px 70px rgba(21,56,100,.26); }.activity-signup-close { position: absolute; top: 10px; right: 12px; border: 0; background: transparent; color: var(--ink-3); font-size: 22px; cursor: pointer; }.activity-signup-dialog h2 { margin: 8px 0; color: var(--ink); font-size: 19px; }.activity-signup-dialog p { margin: 0 0 15px; color: var(--ink-3); font-size: 12px; line-height: 1.6; }.activity-signup-dialog textarea { width: 100%; box-sizing: border-box; min-height: 96px; padding: 10px; border: 1px solid var(--line); border-radius: 9px; outline: none; color: var(--ink-2); font: inherit; font-size: 12px; resize: vertical; }.activity-signup-dialog textarea:focus { border-color: var(--brand); }.activity-signup-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 15px; }
.ai-board { display: grid; grid-template-columns: 270px 1fr; gap: 18px; height: 100%; }.ai-prompts, .ai-chat { border: 1px solid var(--line); border-radius: 15px; background: #fff; }.ai-prompts { padding: 22px; }.ai-mark { color: #8470cf; font-size: 28px; }.ai-prompts h3 { margin: 13px 0 8px; color: var(--ink); font-size: 16px; }.ai-prompts p { color: var(--ink-3); font-size: 12px; line-height: 1.6; }.ai-prompts button { display: block; width: 100%; margin-top: 9px; padding: 9px 10px; border: 1px solid #e3e0f6; border-radius: 8px; background: #faf9ff; color: #6e5ab8; text-align: left; cursor: pointer; font: inherit; font-size: 11px; }.ai-prompts button:hover { background: #f0ecff; }.ai-chat { display: flex; flex-direction: column; min-height: 0; }.ai-chat-head { display: flex; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--line); }.ai-chat-head span { color: var(--ink-3); font-size: 10px; }.ai-history { min-height: 0; flex: 1; overflow: auto; padding: 17px; }.ai-bubble { max-width: 78%; margin: 0 auto 10px 0; padding: 10px 12px; border-radius: 11px 11px 11px 3px; background: #f1f5fb; color: var(--ink-2); font-size: 12px; line-height: 1.7; white-space: pre-wrap; }.ai-bubble.mine { margin-left: auto; margin-right: 0; border-radius: 11px 11px 3px 11px; background: var(--brand-soft); color: var(--brand-strong); }.ai-input { display: flex; gap: 8px; padding: 13px; border-top: 1px solid var(--line); }.ai-input input { min-width: 0; flex: 1; min-height: 35px; padding: 0 10px; border: 1px solid var(--line); border-radius: 8px; outline: none; font: inherit; font-size: 12px; }
.code-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }.code-controls label { display: flex; align-items: center; gap: 9px; color: var(--ink-3); font-size: 11px; }.code-controls select { min-height: 33px; padding: 0 9px; border: 1px solid var(--line); border-radius: 8px; color: var(--ink-2); background: #fff; }.code-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; min-height: 500px; }.code-panel { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); border-radius: 13px; background: #fff; }.code-panel > span { display: flex; align-items: center; justify-content: space-between; padding: 13px 15px; border-bottom: 1px solid var(--line); color: var(--ink-2); font-size: 12px; }.code-panel small { color: var(--ink-3); font-size: 10px; font-weight: 500; }.code-panel textarea, .code-panel pre { min-height: 0; flex: 1; margin: 0; padding: 18px; border: 0; outline: none; resize: none; background: #f5f8fd; color: #254564; font: 12px/1.8 ui-monospace, SFMono-Regular, Consolas, monospace; }.code-panel pre { overflow: auto; white-space: pre-wrap; }
@media (max-width: 820px) { .workspace-layer { padding: 10px; }.workspace-dialog { height: 100%; border-radius: 16px; }.workspace-header { padding: 15px; }.workspace-live { display: none; }.workspace-body { padding: 20px 15px 28px; }.portal-columns, .workspace-list, .ai-board, .code-grid, .activity-detail-layout { grid-template-columns: 1fr; }.portal-stats { grid-template-columns: repeat(2, 1fr); }.workspace-toolbar { align-items: stretch; flex-direction: column; }.workspace-toolbar input { width: 100%; }.toolbar-actions { align-items: stretch; }.workspace-tabs { justify-content: flex-start; }.ai-board { height: auto; }.ai-prompts { order: 2; }.ai-chat { min-height: 500px; }.code-grid { min-height: 700px; }.activity-ticket { position: static; }.activity-detail-hero { height: 230px; }.activity-detail-hero :deep(.event-art) { height: 230px; } }
@media (max-width: 520px) { .workspace-symbol { width: 38px; height: 38px; font-size: 17px; }.workspace-header h2 { font-size: 17px; }.workspace-close { padding: 0 9px; font-size: 0; }.workspace-close span, .workspace-close kbd { font-size: 12px; }.workspace-close kbd { display: none; }.portal-welcome { padding: 22px; }.portal-orb { width: 57px; height: 57px; font-size: 18px; }.portal-welcome h1, .list-board h1 { font-size: 24px; }.card-footer { align-items: flex-end; flex-direction: column; }.card-footer > span { align-self: flex-start; }.card-actions { width: 100%; justify-content: flex-end; }.inline-form { flex-direction: column; } }
</style>
