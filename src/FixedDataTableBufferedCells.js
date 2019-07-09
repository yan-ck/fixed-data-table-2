/**
 * Copyright Schrodinger, LLC
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableBufferedCells
 * @typechecks
 */

import FixedDataTableCell from 'FixedDataTableCell';
import FixedDataTableRow from 'FixedDataTableRow';
import FixedDataTableTranslateDOMPosition from 'FixedDataTableTranslateDOMPosition';
import PropTypes from 'prop-types';
import React from 'react';
import cx from 'cx';
import emptyFunction from 'emptyFunction';
import joinClasses from 'joinClasses';
import inRange from 'lodash/inRange';
import isNil from 'lodash/isNil';
import { sumPropWidths } from 'widthHelper';

class FixedDataTableBufferedCells extends React.Component {
  static propTypes = {
    allowColumnVirtualization: PropTypes.bool,
    isScrolling: PropTypes.bool,
    firstViewportRowIndex: PropTypes.number.isRequired,
    endViewportRowIndex: PropTypes.number.isRequired,
    columnsToRender: PropTypes.array,
    columns: PropTypes.array.isRequired,
    columnOffsets: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    offsetTop: PropTypes.number.isRequired,
    onRowClick: PropTypes.func,
    onRowContextMenu: PropTypes.func,
    onRowDoubleClick: PropTypes.func,
    onRowMouseDown: PropTypes.func,
    onRowMouseUp: PropTypes.func,
    onRowMouseEnter: PropTypes.func,
    onRowMouseLeave: PropTypes.func,
    onRowTouchStart: PropTypes.func,
    onRowTouchEnd: PropTypes.func,
    onRowTouchMove: PropTypes.func,
    rowClassNameGetter: PropTypes.func,
    rowExpanded: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.func,
    ]),
    rowOffsets: PropTypes.object.isRequired,
    rowKeyGetter: PropTypes.func,
    rowSettings: PropTypes.shape({
      rowHeightGetter: PropTypes.func,
      rowsCount: PropTypes.number.isRequired,
      subRowHeightGetter: PropTypes.func,
    }),
    rowsToRender: PropTypes.array.isRequired,
    scrollLeft: PropTypes.number.isRequired,
    scrollTop: PropTypes.number.isRequired,
    showLastRowBorder: PropTypes.bool,
    showScrollbarY: PropTypes.bool,
    width: PropTypes.number.isRequired,
  }

  componentWillMount() {
    this._staticCellArray = [];
    this._staticCellArray.length = this.props.columnsToRender.length * this.props.rowsToRender.length;
    this._initialRender = true;
  }

  componentDidMount() {
    this._initialRender = false;
  }

  shouldComponentUpdate(nextProps) {
    // for non-virtualized buffer, we can skip render if scrolling doesn't lead to any horizontal change
    if (!this.props.allowColumnVirtualization && nextProps.scrolling) {
      return (
        this.props.scrollLeft === nextProps.scrollLeft
      );
    }
    return true;
  }

  render() /*object*/ {
    this._staticCellArray = this._computeVirtualizedCells();
    const {
      offsetLeft,
      offsetTop,
      scrollLeft,
      scrollTop,
    } = this.props;

    // translate the container
    const style = {};
    FixedDataTableTranslateDOMPosition(style, offsetLeft - scrollLeft, offsetTop - scrollTop, false);

    return (
      <div style={style}>
        {this._staticCellArray}
      </div>
    );
  }

  _computeVirtualizedCells() /*array.<object>*/ {
    const virtualizedCells = [];
    const {
      isScrolling,
      columns,
      columnsToRender,
      columnOffsets,
      columnReorderingData,
      rowsToRender,
      rowOffsets,
      rowSettings
    } = this.props;

    const columnCount = columnsToRender.length;
    const rowCount = rowsToRender.length;
    const previousTotalCellCount = this._staticCellArray.length;
    const totalCellCount = rowCount * columnCount;
    const cellGroupWidth = sumPropWidths(columns);

    const isColumnReordering = this.props.isColumnReordering && columns.reduce(function (acc, column) {
        return acc || columnReorderingData.columnKey === column.props.columnKey;
    }, false);

    if (isScrolling) {
      // allow static array to grow while scrolling
      virtualizedCells.length = Math.max(previousTotalCellCount, totalCellCount);
    } else {
      // when scrolling is done, static array can shrink to fit the buffer
      virtualizedCells.length = previousTotalCellCount;
    }

    for (let i = 0; i < virtualizedCells.length; i++) {
      // position of cell in buffer
      const cellStaticColumnIndex = i % columnCount;
      const cellStaticRowIndex = Math.floor(i / columnCount);
      const cellStaticIndex = cellStaticColumnIndex + cellStaticRowIndex * columnCount;

      // actual position of cell
      let cellColumnIndex = columnsToRender[cellStaticColumnIndex];
      let cellRowIndex = rowsToRender[cellStaticRowIndex];

      if (cellColumnIndex === undefined) {
        cellColumnIndex = this._staticCellArray[cellStaticIndex] && this._staticCellArray[cellStaticIndex].props.columnIndex;
      }

      if (cellRowIndex === undefined) {
        cellRowIndex = this._staticCellArray[cellStaticIndex] && this._staticCellArray[cellStaticIndex].props.rowIndex;
      }

      // position of the cell
      const cellLeft = columnOffsets[cellColumnIndex];
      const cellTop = rowOffsets[cellRowIndex];
      const cellHeight = rowSettings.rowHeightGetter(cellRowIndex);

      virtualizedCells[cellStaticIndex] = this._renderCell(
        cellStaticIndex,
        cellRowIndex,
        cellColumnIndex,
        cellLeft,
        cellTop,
        cellHeight,
        isColumnReordering,
        cellGroupWidth
      );
    }

    return virtualizedCells;
  }

  /**
   * @param {number} key
   * @param {number} rowIndex
   * @param {number} columnIndex
   * @param {number} left
   * @param {number} top
   * @param {number} height
   * @param {boolean} isColumnReordering
   * @param {number} cellGroupWidth
   * @return {?Object}
   */
  _renderCell(key, rowIndex, columnIndex, left, top, height, isColumnReordering, cellGroupWidth) /*object*/ {
    if (isNil(columnIndex) || isNil(rowIndex)) {
      return null;
    }

    const {
      columns,
      isScrolling,
      scrollLeft,
      scrollTop,
    } = this.props;

    if (!columns[columnIndex]) {
      console.log(columnIndex);
    }
    const columnProps = columns[columnIndex].props;
    const { width } = columnProps;
    const cellTemplate = columns[columnIndex].template;

    const visible = (left + width >= scrollLeft && left - scrollLeft < this.props.width) && (
        top + height >= scrollTop && top - scrollTop < this.props.height
      );
    const recycle = columnProps.allowCellsRecycling;

    // if cell is recyclable then no need to render it into the DOM when it's not visible
    if (recycle && !isColumnReordering && !visible) {
      return null;
    }


    var cellIsResizable = columnProps.isResizable && this.props.onColumnResize;
    var onColumnResize = cellIsResizable ? this.props.onColumnResize : null;

    var cellIsReorderable = columnProps.isReorderable && this.props.onColumnReorder && rowIndex === -1 && cellGroupWidth !== columnProps.width;
    var onColumnReorder = cellIsReorderable ? this.props.onColumnReorder : null;

    var className = columnProps.cellClassName;
    var pureRendering = columnProps.pureRendering || false;

    return (
      <FixedDataTableCell
        key={key}
        columnKey={columnProps.columnKey || columnIndex}
        columnIndex={columnIndex}
        rowIndex={rowIndex}
        cell={cellTemplate}
        cellGroupWidth={cellGroupWidth}
        isScrolling={isScrolling}
        align={columnProps.align}
        className={className}
        columnReorderingData={this.props.columnReorderingData}
        height={height}
        isColumnReordering={isColumnReordering}
        left={left}
        top={top}
        maxWidth={columnProps.maxWidth}
        minWidth={columnProps.minWidth}
        onColumnResize={onColumnResize}
        onColumnReorder={onColumnReorder}
        onColumnReorderMove={this.props.onColumnReorderMove}
        onColumnReorderEnd={this.props.onColumnReorderEnd}
        pureRendering={pureRendering}
        touchEnabled={this.props.touchEnabled}
        width={columnProps.width}
        visible={visible}
      />
    );
  }
}

module.exports = FixedDataTableBufferedCells;
