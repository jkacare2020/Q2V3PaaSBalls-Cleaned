<template>
  <div :class="`q-ml-${level * 4}`">
    <q-item>
      <q-item-section avatar>
        <q-avatar size="32px">
          <img :src="computedAvatar" />

          <q-badge
            rounded
            floating
            :color="comment.online ? 'green' : 'red'"
            class="presence-dot"
          />
        </q-avatar>
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-bold">
          {{ comment.userName || comment.displayName || "User" }}
        </q-item-label>

        <!-- Optional reply context -->
        <q-item-label caption v-if="comment.replyTo && getUserName">
          <q-icon name="reply" size="16px" color="grey" class="q-mr-xs" />
          Replying to <strong>{{ getUserName(comment.replyTo) }}</strong>
        </q-item-label>

        <q-item-label caption>{{ comment.text }}</q-item-label>
        <q-item-label caption class="text-grey-6">
          {{ new Date(comment.timestamp).toLocaleString() }}
          <span v-if="comment.edited">(edited)</span>
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <!-- Optionally, add 3-dot menu or actions -->
      </q-item-section>
    </q-item>

    <!-- 🧵 Render replies to this comment -->
    <template v-if="repliesByCommentId?.[comment.id]?.length">
      <CommentItem
        v-for="reply in repliesByCommentId[comment.id]"
        :key="reply.id"
        :comment="reply"
        :repliesByCommentId="repliesByCommentId"
        :getUserName="getUserName"
        :level="level + 1"
      />
    </template>
  </div>
</template>
<script setup>
import { computed } from "vue";
import defaultAvatar from "src/assets/avatar.png";

// 🔥 Use defineProps to destructure props
const props = defineProps({
  comment: Object,
  repliesByCommentId: Object,
  getUserName: Function,
  level: {
    type: Number,
    default: 0,
  },
});

// ✅ Computed fallback avatar
const computedAvatar = computed(() =>
  props.comment?.avatarUrl && props.comment.avatarUrl.length > 5
    ? props.comment.avatarUrl
    : defaultAvatar
);
</script>
