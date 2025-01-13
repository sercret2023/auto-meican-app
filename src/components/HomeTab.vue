<template>
  <div class="home-tab">
    <!-- 数据展示区域 -->
    <div v-if="homeData" class="data-container">
      <div v-if="homeData.length > 0" class="data-grid">
        <!-- 正常菜品列表 -->
        <div 
          v-for="(item, index) in homeData" 
          :key="index"
          class="data-item"
          :class="{
            selected: selectedItem === item,
            disabled: isBlacklisted(item)
          }"
          @click="!isBlacklisted(item) && handleItemClick($event, item)"
        >
          <pre class="item-content">{{ item }}</pre>
          <div v-if="getSelectedDates(item)" class="selected-dates">
            <span>已选日期：</span>
            <div class="date-tags">
              <el-tag
                v-for="(date, i) in getSelectedDates(item)"
                :key="i"
                size="small"
                class="date-tag"
              >
                {{ date }}
              </el-tag>
            </div>
          </div>
          <div class="action-buttons">
            <el-button
              v-if="getSelectedDates(item)"
              type="text"
              size="small"
              @click.stop="handleClearDates(item)"
              class="clear-dates-btn"
            >
              清空
            </el-button>
            <el-button
              v-if="isBlacklisted(item)"
              type="danger"
              size="small"
              @click.stop="handleUnblacklist(item)"
            >
              取消拉黑
            </el-button>
            <el-button
              v-else
              type="warning"
              size="small"
              @click.stop="handleBlacklist(item)"
            >
              拉黑
            </el-button>
          </div>
        </div>
      </div>
      <div v-else class="data-grid">
        <!-- 随机点菜 -->
        <div 
          class="data-item"
          @click="handleRandomOrder"
        >
          <div class="random-order-content">
            <el-icon><MagicStick /></el-icon>
            <span>随机点菜</span>
          </div>
        </div>
      </div>
    </div>
    
    <p v-else>正在加载数据...</p>

    <!-- 日期选择弹窗 -->
    <el-dialog
      v-model="datePickerVisible"
      title="选择日期"
      :width="isMobile ? '90%' : '30%'"
      :style="dialogStyle"
      class="date-picker-dialog"
    >
      <div class="date-grid">
        <div 
          v-for="(date, index) in availableDates"
          :key="index"
          class="date-item"
          :class="{ selected: isDateSelected(date) }"
          @click="toggleDateSelection(date)"
        >
          {{ formatDisplayDate(date) }}
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="datePickerVisible = false">取消</el-button>
          <el-button type="primary" @click="handleDateConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 提交订单按钮 -->
    <div v-if="orderData.length > 0" class="submit-order">
      <el-button 
        type="primary" 
        size="large"
        @click="handleSubmitOrder"
      >
        批量提交订单 ({{ orderData.length }})
      </el-button>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import api from '@/api'
import { MagicStick } from '@element-plus/icons-vue'

export default {
  components: {
    MagicStick
  },
  props: {
    homeData: Array,
    orderData: Array
  },
  emits: ['update:orderData', 'submit-success', 'update:homeData'],
  data() {
    return {
      selectedItem: null,
      datePickerVisible: false,
      selectedDates: [],
      currentItem: null,
      defaultDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      dialogStyle: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      },
      isMobile: window.innerWidth <= 768,
      blacklist: [] // 拉黑列表
    }
  },
  async created() {
    await this.fetchBlacklist()
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleItemClick(event, item) {
      if (this.isBlacklisted(item)) return
      this.currentItem = item
      this.selectedDates = []
      this.availableDates = this.getAvailableDates()
      this.datePickerVisible = true
    },
    handleDateConfirm() {
      if (this.selectedDates.length === 0) {
        ElMessage.warning('请至少选择一个日期')
        return;
      }

      // 使用formatSubmitDate格式化提交数据
      const formattedDates = this.selectedDates.map(date => 
        this.formatSubmitDate(date)
      );

      // 查找是否已存在该菜品的订单
      const existingIndex = this.orderData.findIndex(
        order => order.item === this.currentItem
      )

      // 创建新的订单数据
      let newOrderData = [...this.orderData]
      if (existingIndex !== -1) {
        // 更新已有订单
        newOrderData[existingIndex].dates = formattedDates
      } else {
        // 添加新订单
        newOrderData.push({
          item: this.currentItem,
          dates: formattedDates
        })
      }
      
      // 触发更新
      this.$emit('update:orderData', newOrderData)
      
      // 重置状态
      this.selectedDates = []
      this.datePickerVisible = false
      ElMessage.success('日期选择完成')
    },
    getSelectedDates(item) {
      const order = this.orderData.find(order => order.item === item)
      if (order && order.dates.length > 0) {
        return order.dates.map(date => this.formatDate(date))
      }
      return null
    },
    formatDate(date) {
      const d = new Date(date);
      // const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekday = weekdays[d.getDay()];
      return `${month}-${day} 周${weekday}`;
    },
    isDateDisabled(date) {
      const today = new Date()
      const twoWeeksLater = new Date(today)
      twoWeeksLater.setDate(today.getDate() + 14)

      if (date < today || date > twoWeeksLater) {
        return true
      }

      const allSelectedDates = this.orderData
        .flatMap(order => order.dates)
        .map(d => new Date(d).toDateString())

      return allSelectedDates.includes(new Date(date).toDateString())
    },
    async handleSubmitOrder() {
      let successCount = 0
      let errorCount = 0

      try {
        // 转换数据格式，为每个日期生成单独的订单
        const orders = this.orderData.flatMap(order => 
          order.dates.map(date => ({
            orderDish: order.item,
            orderDate: date // 直接使用已格式化的日期
          }))
        );

        // 逐个提交订单
        for (const order of orders) {
          try {
            await api.submitOrder(order)
            successCount++
          } catch (error) {
            console.error('提交订单失败:', error)
            errorCount++
          }
        }

        // 显示最终结果
        if (errorCount === 0) {
          ElMessage.success(`所有订单提交成功 (${successCount}个)`)
        } else if (successCount === 0) {
          ElMessage.error(`所有订单提交失败 (${errorCount}个)`)
        } else {
          ElMessage.warning(`部分订单提交成功 (成功${successCount}个，失败${errorCount}个)`)
        }

        // 清空订单数据
        this.$emit('update:orderData', []);
        this.$emit('submit-success');
      } catch (error) {
        console.error('提交订单失败:', error)
        ElMessage.error('提交订单失败')
      }
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 768
    },
    handleRandomOrder() {
      // 创建新的数组并触发更新
      const newHomeData = this.homeData ? [...this.homeData] : []
      newHomeData.push("随机点菜")
      this.$emit('update:homeData', newHomeData)
      
      // 调用正常的点击处理逻辑
      this.$nextTick(() => {
        this.handleItemClick(null, "随机点菜")
      })
    },
    // 获取拉黑列表
    async fetchBlacklist() {
      try {
        this.blacklist = await api.getBlacklist()
      } catch (error) {
        console.error('获取拉黑列表失败:', error)
        ElMessage.error('获取拉黑列表失败')
      }
    },
    
    // 判断菜品是否在拉黑列表中
    isBlacklisted(item) {
      return this.blacklist.includes(item)
    },
    
    // 拉黑菜品
    async handleBlacklist(item) {
      try {
        await api.addToBlacklist(this.blacklist, item)
        this.blacklist = [...this.blacklist, item]
        ElMessage.success('拉黑成功')
      } catch (error) {
        console.error('拉黑失败:', error)
        ElMessage.error('拉黑失败')
      }
    },
    
    // 取消拉黑
    async handleUnblacklist(item) {
      try {
        await api.removeFromBlacklist(this.blacklist, item)
        this.blacklist = this.blacklist.filter(i => i !== item)
        ElMessage.success('取消拉黑成功')
      } catch (error) {
        console.error('取消拉黑失败:', error)
        ElMessage.error('取消拉黑失败')
      }
    },
    
    handleClearDates(item) {
      const newOrderData = this.orderData.filter(order => order.item !== item)
      this.$emit('update:orderData', newOrderData)
      ElMessage.success('已清空该菜品的日期选择')
    },
    getAvailableDates() {
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (!this.isDateDisabled(date)) {
          dates.push(date);
        }
      }
      return dates;
    },
    isDateSelected(date) {
      return this.selectedDates.some(
        selectedDate => selectedDate.toDateString() === date.toDateString()
      );
    },
    toggleDateSelection(date) {
      if (this.isDateSelected(date)) {
        this.selectedDates = this.selectedDates.filter(
          selectedDate => selectedDate.toDateString() !== date.toDateString()
        );
      } else {
        this.selectedDates.push(date);
      }
    },
    // 新增方法用于格式化提交数据
    formatSubmitDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    // 修改formatDate方法，仅用于显示
    formatDisplayDate(date) {
      const d = new Date(date);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekday = weekdays[d.getDay()];
      return `${month}-${day} 周${weekday}`;
    },
    // 新增方法：获取状态显示文本
    getStatusText(status) {
      switch (status) {
        case 'INIT':
          return '初始化';
        case 'SUCCESS':
          return '成功';
        case 'FAIL':
          return '失败';
        case 'EXPIRE':
          return '已过期';
        default:
          return '未知状态';
      }
    },
    // 新增方法：获取状态颜色
    getStatusColor(status) {
      switch (status) {
        case 'INIT':
          return 'info';
        case 'SUCCESS':
          return 'success';
        case 'FAIL':
          return 'danger';
        case 'EXPIRE':
          return 'warning';
        default:
          return 'info';
      }
    }
  },
  computed: {
    availableDates() {
      return this.getAvailableDates();
    }
  }
}
</script>

<style scoped>
.home-tab {
  padding: 0px;
}

.data-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0px;
  background: white;
  border-radius: 12px;
  /* box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); */
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.data-item {
  position: relative;
  padding: 20px;
  padding-bottom: 4px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: linear-gradient(145deg, #ffffff, #f8f9fe);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-height: auto;
  @media (max-width: 768px) {
    padding-bottom: 2px;
  }

  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
    transform: translateY(-4px);
  }
  
  &.selected {
    border-color: #667eea;
    background: linear-gradient(145deg, #f8f9fe, #e6f0ff);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  }
  
  @media (max-width: 768px) {
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    
    &:hover {
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    }
  }
}

.data-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.data-item.selected {
  border-color: #667eea;
  background-color: #f8f9fe;
}

.item-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  font-family: 'Courier New', Courier, monospace;
  max-height: 120px;
  overflow: hidden;
  flex-grow: 1;
  margin-bottom: 8px;
  @media (max-width: 768px) {
    font-size: 13px;
    max-height: 100px;
    margin-bottom: 6px;
  }
}

.submit-order {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.date-picker-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  @media (max-width: 768px) {
    width: 90%;
    max-width: 400px;
  }
}

:deep(.el-picker-panel) {
  @media (max-width: 768px) {
    width: 100% !important;
    max-width: 100%;
  }
}

:deep(.el-date-table) {
  @media (max-width: 768px) {
    width: 100% !important;
  }
}

:deep(.el-date-table td) {
  @media (max-width: 768px) {
    padding: 8px !important;
    width: 14.28%;
  }
}

:deep(.el-date-picker__header) {
  @media (max-width: 768px) {
    padding: 8px;
  }
}

:deep(.el-picker-panel__body) {
  @media (max-width: 768px) {
    padding: 8px;
  }
}

:deep(.el-date-picker__time-header) {
  @media (max-width: 768px) {
    padding: 8px;
  }
}

:deep(.el-date-picker__header-label) {
  @media (max-width: 768px) {
    font-size: 14px;
  }
}

/* 移动端样式 */
@media (max-width: 768px) {
  .data-grid {
    grid-template-columns: 1fr;
  }

  .data-item {
    padding: 16px;
  }

  .submit-order {
    bottom: 10px;
    right: 10px;
    padding: 8px 16px;
  }

  :deep(.el-date-editor) {
    width: 100% !important;
  }
  
  :deep(.el-picker-panel) {
    width: 100% !important;
  }
  
  :deep(.el-date-table) {
    width: 100% !important;
  }
  
  :deep(.el-date-table td) {
    padding: 8px !important;
  }

  .date-picker-dialog {
    width: 90%;
    max-width: 400px;
  }

  :deep(.el-picker-panel) {
    width: 100% !important;
    max-width: 100%;
  }

  :deep(.el-date-table) {
    width: 100% !important;
  }

  :deep(.el-date-table td) {
    padding: 8px !important;
    width: 14.28%;
  }
}

.random-order-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: #666;
  @media (max-width: 768px) {
    gap: 6px;
    
    .el-icon {
      font-size: 28px;
    }
    
    span {
      font-size: 14px;
    }
  }
}

.random-order-content .el-icon {
  font-size: 32px;
}

.random-order-content span {
  font-size: 16px;
}

.data-item.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.action-buttons {
  position: static;
  margin-top: 2px;
  padding-top: 4px;
  padding-bottom: 0;
  border-top: 1px solid rgba(224, 224, 224, 0.3);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  /* padding: 8px 0; */
  height: 36px;
  align-items: center;
  @media (max-width: 768px) {
    margin-top: 1px;
    padding-top: 2px;
  }
}

.action-buttons .el-button {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.clear-dates-btn {
  color: #666;
  border-color: #dcdfe6;
  background-color: #f5f7fa;
}

.clear-dates-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.data-item:hover .action-buttons {
  opacity: 1;
}

.data-item.disabled .action-buttons {
  opacity: 1;
}

.action-buttons .el-button {
  pointer-events: auto;
}

.selected-dates {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  @media (max-width: 768px) {
    font-size: 11px;
    gap: 6px;
    margin-top: 6px;
    margin-bottom: 6px;
  }
}

.date-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  @media (max-width: 768px) {
    gap: 3px;
  }
}

.date-tag {
  margin-right: 4px;
  margin-bottom: 4px;
  @media (max-width: 768px) {
    margin-right: 3px;
    margin-bottom: 3px;
  }
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  padding: 12px;
}

.date-item {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.date-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

@media (max-width: 768px) {
  .date-grid {
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 6px;
    padding: 8px;
  }
  
  .date-item {
    padding: 8px;
    font-size: 14px;
  }
}

/* 新增状态标签样式 */
.status-tag {
  margin-top: 8px;
  text-align: right;
}

.el-tag {
  margin-right: 8px;
}
</style> 