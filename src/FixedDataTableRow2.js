/**
 * Copyright Schrodinger, LLC
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableRow2
 * @typechecks
 */

'use strict';

import FixedDataTableCell from 'FixedDataTableCell';
import FixedDataTableTranslateDOMPosition from 'FixedDataTableTranslateDOMPosition';
import PropTypes from 'prop-types';
import React from 'react';
import Scrollbar from 'Scrollbar';
import cx from 'cx';
import joinClasses from 'joinClasses';
import isNil from 'lodash/isNil';
import { sumPropWidths } from 'widthHelper';

/**
 * Component that renders the row for <FixedDataTable />.
 * This component should not be used directly by developer. Instead,
 * only <FixedDataTable /> should use the component internally.
 */
class FixedDataTableRow extends React.Component {
  constructor() {
    super();
    this._staticCellArray = [];
  }

  static propTypes = {

  };

  render() /*object*/ {
    if (this.props.fake) {
      return null;
    }

    this._staticCellArray = this._computeVirtualizedCells();

    return (
      <div className={'row'}>
        {this._staticCellArray}
      </div>
    );
  }

  _computeVirtualizedCells() {
    const { scrollableColumns, scrollContentWidth, columnOffsets, columnsToRender, isScrolling, fixedColumns } = this.props;
    let cells = [];
    const fixedLeftCellGroupWidth = sumPropWidths(fixedColumns);

    if (isScrolling) {
      // allow static array to grow while scrolling
      cells.length = Math.max(this._staticCellArray.length, columnsToRender.length);
    } else {
      // when scrolling is done, static array can shrink to fit the buffer
      cells.length = columnsToRender.length;
    }

    for (let i = 0; i < cells.length; i++) {
      let cellColumnIndex = columnsToRender[i];

      if (cellColumnIndex === undefined) {
        cellColumnIndex = this._staticCellArray[i] && this._staticCellArray[i].props.columnIndex;
      }

      cells[i] = this._renderCell(
        i,
        cellColumnIndex,
        fixedLeftCellGroupWidth + columnOffsets[cellColumnIndex],
        fixedLeftCellGroupWidth,
        false,
        false,
        scrollableColumns[cellColumnIndex],
        scrollContentWidth
      );
    }

    return cells;
  }

  /**
   * @param {(string|number)} key
   * @param {number} columnIndex
   * @param {number} left
   * @param {number} offsetLeft
   * @param {boolean} recyclable
   * @param {boolean} isColumnReordering
   * @param {object} columnInfo
   * @param {number} cellGroupWidth
   * @return {?Object}
   */
  _renderCell(key, columnIndex, left, offsetLeft, recyclable, isColumnReordering, columnInfo, cellGroupWidth) /*object*/ {
    if (isNil(columnIndex)) {
      return null;
    }

    const {
      isScrolling,
      index: rowIndex,
    } = this.props;

    const columnProps = columnInfo.props;
    const { width } = columnProps;

    const visible = (left + width >= offsetLeft && left - offsetLeft < cellGroupWidth) && this.props.visible;

    // todo: cellGroupWidth
    if (rowIndex === 0 && columnIndex === 0) {
      console.log(left, width, offsetLeft, cellGroupWidth, visible);
    }

    // if cell is recyclable then no need to render it into the DOM when it's not visible
    if (recyclable && !isColumnReordering && !visible) {
      return undefined;
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
        cell={columnInfo.template}
        cellGroupWidth={cellGroupWidth}
        isScrolling={isScrolling}
        align={columnProps.align}
        className={className}
        columnReorderingData={this.props.columnReorderingData}
        height={this.props.height}
        isColumnReordering={isColumnReordering}
        left={left}
        top={this.props.offsetTop}
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

module.exports = FixedDataTableRow;
