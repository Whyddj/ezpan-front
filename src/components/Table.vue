<template>
    <div>
        <el-table ref="dataTable" :data="dataSource.list || []" :height="tableHeight" :stripe="options.stripe"
            :border="options.border" header-row-class-name="table-header-row" highlight-current-row
            @row-click="handleSelectionChange">
            <el-table-column v-if="options.selectType && options.selectType == 'checkbox'" type="selection" width="50"
                align="center"></el-table-column>
            <el-table-column v-if="options.showIndex" label="序号" type="index" width="60"
                align="center"></el-table-column>
            <template v-for="(column, index) in columns">
                <template v-if="column.scopedSlots">
                    <el-table-column :key="index" :prop="column.prop" :label="column.label"
                        :align="column.align || 'left'" :width="column.width">
                        <template #default="scoped">
                            <slot :name="column.scopedSlots" :row="scoped.row" :index="scoped.$index" :column="column">
                            </slot>
                        </template>
                    </el-table-column>
                </template>
                <template v-else>
                    <el-table-column :key="index" :prop="column.prop" :label="column.label"
                        :align="column.align || 'left'" :width="column.width" :fixed="column.fixed">
                    </el-table-column>
                </template>
            </template>
        </el-table>
        <!-- 分页 -->
        <div class="pagination" v-if="showPagination">
            <el-pagination v-if="dataSource.totalCount" background :total="dataSource.totalCount"
                :page-sizes="[15, 30, 50, 100]" :page-size="dataSource.pageSize" :current-page.sync="dataSource.pageNo"
                :layout="layout" @size-change="handlePageSizeChange" @current-change="handlePageNoChange"
                style="text-align: right;">
            </el-pagination>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
const emit = defineEmits(["rowSelected", "rowClick"]);
const props = defineProps({
    showPagination: {
        type: Boolean,
        default: true
    },
    showPageSize: {
        type: Boolean,
        default: true
    },
    options: {
        type: Object,
        default: {
            extHeight: 0,
            showIndex: false,
        }
    },
    columns: Array,
    fetch: Function, // 获取数据的方法
    initFetch: {
        type: Boolean,
        default: true
    },
})

const layout = computed(() => {
    return `total, ${props.showPageSize ? "sizes," : ""
        }, prev, pager, next, jumper`;
})
// 顶部60 内容区20 内容上下内间距15*2 分页46
const topHeight = 60 + 20 + 30 + 46

const tableHeight = ref(
    props.options.tableHeight ? props.options.tableHeight : window.innerHeight - topHeight - props.options.extHeight
)

const init = () => {
    if (props.initFetch && props.fetch) {
        props.fetch()
    }
}
init()

const dataTable = ref()

const clearSelection = () => {
    dataTable.value.clearSelection()
}

const setCurrentRow = (rowKey, rowValue) => {
    let row = props.dataSource.list.find(item => item[rowKey] == rowValue)
    dataTable.value.setCurrentRow(row)
}
defineExpose({
    clearSelection,
    setCurrentRow
})

const handleRowClick = (row) => {
    emit("rowClick", row)
}

const handleSelectionChange = (selection) => {
    emit("rowSelected", selection)
}

const handlePageSizeChange = (size) => {
    props.dataSource.pageSize = size
    props.dataSource.pageNo = 1
    props.fetch()
}

const handlePageNoChange = (pageNo) => {
    props.dataSource.pageNo = pageNo
    props.fetch()
}

</script>

<style lang="scss" scoped>
.pagination {
    padding-top: 10px;
    padding-right: 10px;
}
.el-pagination {
    justify-content: right;
}

:deep .el-table__cell {
    padding: 4px 0px;
}
</style>
