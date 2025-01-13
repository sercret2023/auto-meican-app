<template>
  <div class="auto-order-tab">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>自动点餐设置</span>
          <span class="expire-date">
            有效期至：
            <el-date-picker
              v-model="localExpireDate"
              type="date"
              placeholder="选择日期"
              :disabled-date="disabledDate"
              @change="handleExpireDateChange"
            />
          </span>
        </div>
      </template>

      <!-- 黑名单列表 -->
      <div class="blacklist-section">
        <h3>黑名单菜品</h3>
        
        <!-- 添加新菜品 -->
        <div class="add-dish-section">
          <el-select
            v-model="newItem"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入菜品"
            :loading="!availableDishes"
          >
            <el-option
              v-for="dish in availableDishes"
              :key="dish"
              :label="dish"
              :value="dish"
            />
          </el-select>
          <el-button 
            type="primary" 
            @click="handleAdd"
            style="margin-left: 10px"
          >
            添加
          </el-button>
        </div>

        <!-- 黑名单列表 -->
        <div class="tags-container">
          <el-tag
            v-for="item in blacklist"
            :key="item"
            closable
            @close="handleRemove(item)"
            :title="item"
          >
            {{ item }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  props: {
    blacklist: {
      type: Array,
      required: true
    },
    expireDate: {
      type: [String, null],
      default: null
    },
    availableDishes: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      newItem: '',
      localExpireDate: this.expireDate
    }
  },
  watch: {
    expireDate(newVal) {
      this.localExpireDate = newVal
    }
  },
  methods: {
    async handleAdd() {
      if (this.newItem.trim()) {
        try {
          await this.$emit('add-to-blacklist', this.newItem.trim())
          this.newItem = ''
          this.$emit('refresh')
        } catch (error) {
          this.$message.error('添加失败：' + error.message)
        }
      } else {
        this.$message.warning('请选择或输入菜品')
      }
    },
    handleRemove(item) {
      this.$emit('remove-from-blacklist', item)
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
      return localDate.toLocaleDateString();
    },
    async handleExpireDateChange(date) {
      try {
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
          .toISOString()
          .split('T')[0];
        
        await this.$emit('update-expire-date', localDate)
        this.$message.success('有效期更新成功')
      } catch (error) {
        this.$message.error('更新有效期失败：' + error.message)
      }
    },
    disabledDate(time) {
      // 禁用今天之前的日期
      return time.getTime() < Date.now() - 8.64e7
    }
  }
}
</script>

<style scoped lang="scss">
.auto-order-tab {
  padding: 20px;
}

.blacklist-section {
  margin-top: 20px;

  h3 {
    margin-bottom: 16px;
    font-size: 16px;
    color: #303133;
  }

  .add-dish-section {
    margin-bottom: 20px;
    display: flex;
    align-items: center;

    .el-select {
      flex: 1;
      margin-right: 12px;
    }
  }

  .el-tag {
    margin: 0;
    padding: 0 28px 0 12px;
    height: auto;
    min-height: 32px;
    line-height: 32px;
    font-size: 14px;
    border-radius: 16px;
    position: relative;
    transition: all 0.3s ease;
    max-width: 100%;
    white-space: normal;
    word-break: break-word;
    display: inline-flex;
    align-items: center;

    // 强制显示关闭按钮
    ::v-deep .el-icon-close {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      width: 16px;
      height: 16px;
      line-height: 16px;
      color: #fff !important;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 50%;
      transition: all 0.2s ease;
      flex-shrink: 0;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.3);
        transform: translateY(-50%) scale(1.1);
      }
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

.tags-container {
  padding-right: 8px;
  margin-bottom: 16px;
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

// 移动端优化
@media (max-width: 768px) {
  .blacklist-section {
    h3 {
      font-size: 15px;
    }

    .el-tag {
      padding: 0 24px 0 10px;
      min-height: 28px;
      line-height: 28px;
      font-size: 13px;

      ::v-deep .el-icon-close {
        right: 2px;
        font-size: 12px;
        width: 14px;
        height: 14px;
        line-height: 14px;
      }
    }

    .add-dish-section {
      flex-direction: column;
      gap: 12px;

      .el-select {
        width: 100%;
        margin-right: 0;
      }

      .el-button {
        width: 100%;
      }
    }
  }

  .tags-container {
    gap: 6px;
  }
}

// 小屏手机优化
@media (max-width: 480px) {
  .blacklist-section {
    h3 {
      font-size: 14px;
    }

    .el-tag {
      padding: 0 20px 0 8px;
      min-height: 24px;
      line-height: 24px;
      font-size: 12px;

      ::v-deep .el-icon-close {
        right: 1px;
        font-size: 10px;
        width: 12px;
        height: 12px;
        line-height: 12px;
      }
    }

    .add-dish-section {
      gap: 8px;
    }
  }

  .tags-container {
    gap: 4px;
  }
}

.el-input {
  margin-top: 20px;
  width: 300px;
}

.expire-date {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-date-editor) {
  width: 160px;
}
</style> 