import { Component, OnInit } from '@angular/core';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as am5plugins_exporting from '@amcharts/amcharts5/plugins/exporting';
import { data } from './data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'charts';
  valueSeries: any;
  alarmSeries: any;
  chart: any;
  root: any;
  valueyAxis: any;
  dateAxis: any;
  alarmAxis: any;
  valueLengend: any;
  start: number;
  end: number;
  open = '(';
  close = ')';
  allfruits = [];

  ngOnInit(): void {
    const count = {
      value: 10,
      urgency: 1,
    };
    // console.log('count value ' + count.value);
    this.createGraph();
  }

  createGraph() {
    this.root = am5.Root.new('chartdiv');

    this.root.durationFormatter.setAll({
      baseUnit: 'second',
      durationFormat: 'mm:ss',
      durationFields: ['valueY'],
    });

    this.root.setThemes([am5themes_Animated.new(this.root)]);
    this.chart = this.root.container.children.push(
      am5xy.XYChart.new(this.root, {
        focusable: true,
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
      })
    );

    this.chart.get('colors').set('step', 3);
    const alarmAxisRenderer = am5xy.AxisRendererY.new(this.root, {
      opposite: false,
      pan: 'zoom',
    });
    alarmAxisRenderer.labels.template.setAll({
      centerY: am5.percent(100),
      maxPosition: 0.98,
    });
    this.alarmAxis = this.chart.yAxes.push(
      am5xy.ValueAxis.new(this.root, {
        renderer: alarmAxisRenderer,
        height: am5.percent(25),
        dy: 300,
        layer: 1,
      })
    );
    this.alarmAxis.axisHeader.set('paddingTop', 0);
    this.alarmAxis.axisHeader.children.push(
      am5.Label.new(this.root, {
        text: 'Alarms',
        fontWeight: 'bold',
        paddingTop: 5,
        paddingBottom: 5,
        numberFormat: '#,###.00',
      })
    );

    const dateAxisRenderer = am5xy.AxisRendererX.new(this.root, {
      pan: 'zoom',
      minGridDistance: 30,
    });
    dateAxisRenderer.labels.template.setAll({
      rotation: -90,
      centerY: am5.p50,
      centerX: am5.p100,
      paddingRight: 15,
      dy: 30,
    });
    this.dateAxis = this.chart.xAxes.push(
      am5xy.DateAxis.new(this.root, {
        groupData: true,
        maxDeviation: 0.5,
        tooltipDateFormat: 'hh:mm a',
        baseInterval: {
          timeUnit: 'second',
          count: 1,
        },
        renderer: dateAxisRenderer,
      })
    );

    this.dateAxis.get('dateFormats')['minute'] = 'hh:mm a';
    this.dateAxis.set('tooltip', am5.Tooltip.new(this.root, {}));
    this.createLineSeries('Battery Voltage', 'voltage', false);
    this.createLineSeries('Battery Temperature', 'temp', true);

    this.createLineSeries('Battery Current', 'current', false);
    this.createLineSeries('Alarm', 'alarm', true);
    this.createAlarmSeries();

    this.createLegend();
    this.chart.appear(1000, 100);
    console.log(this.chart);
  }

  createLineSeries(name: string, field: string, opposite: boolean) {
    let yRenderer = am5xy.AxisRendererY.new(this.root, {
      opposite: opposite,
      x: am5.percent(10),
      centerX: am5.percent(10),
    });
    yRenderer.labels.template.setAll({
      centerY: am5.percent(100),
      maxPosition: 0.98,
    });
    let valueyAxis = this.chart.yAxes.push(
      am5xy.ValueAxis.new(this.root, {
        maxDeviation: 1,
        renderer: yRenderer,
        height: am5.percent(70),
      })
    );
    if (this.chart.yAxes.indexOf(valueyAxis) > 0) {
      valueyAxis.set('syncWithAxis', this.chart.yAxes.getIndex(0));
    }

    let valueSeries = this.chart.series.push(
      am5xy.LineSeries.new(this.root, {
        name: name,
        xAxis: this.dateAxis,
        yAxis: valueyAxis,
        valueYField: field,
        valueXField: 'date',
        legendValueText: '{valueY}',
        tooltip: am5.Tooltip.new(this.root, {
          pointerOrientation: 'horizontal',
          labelText: '{name}: {valueY}',
        }),
      })
    );

    valueSeries.strokes.template.setAll({ strokeWidth: 1 });

    yRenderer.grid.template.set('strokeOpacity', 0.05);
    yRenderer.labels.template.set('fill', valueSeries.get('fill'));
    yRenderer.setAll({
      stroke: valueSeries.get('fill'),
      strokeOpacity: 1,
      opacity: 1,
    });

    const cursor = this.chart.set(
      'cursor',
      am5xy.XYCursor.new(this.root, {
        xAxis: this.dateAxis,
        behavior: 'none',
      })
    );
    cursor.lineY.set('visible', false);

    let scrollbarX = am5.Scrollbar.new(this.root, {
      orientation: 'horizontal',
      height: 20,
    });
    this.chart.set('scrollbarX', scrollbarX);
    scrollbarX.events.on('dragstart', () => {
      console.log('drag');
    });
    valueSeries.data.setAll(data);
  }

  createAlarmSeries() {
    const firstColor = this.chart.get('colors').getIndex(0);
    this.alarmSeries = this.chart.series.push(
      am5xy.ColumnSeries.new(this.root, {
        name: 'Alarms',
        fill: firstColor,
        stroke: firstColor,
        valueYField: 'alarm',
        valueXField: 'date',
        valueYGrouped: 'sum',
        xAxis: this.dateAxis,
        yAxis: this.alarmAxis,
        legendValueText: '{valueY}',
      })
    );

    const tooltip = this.alarmSeries.set(
      'tooltip',
      am5.Tooltip.new(this.root, {
        getFillFromSprite: false,
        getStrokeFromSprite: true,
        autoTextColor: false,
        pointerOrientation: 'vertical',
      })
    );
    tooltip.get('background').setAll({
      fill: am5.color('#ffffff'),
    });

    let test = [];
    tooltip.label.setAll({
      fill: am5.color(0x000000),
      keepTargetHover: true,
    });

    tooltip.label.adapters.add('text', (text: any, target: any, key: any) => {
      let allFruits = [];
      if (target.dataItem && target.dataItem.dataContext.fruits) {
        this.allfruits = target.dataItem.dataContext.fruits;
        text = `[#b30000]${this.open} ${this.allfruits.length}${
          this.close
        }: ${this.allfruits.slice(0, 2)}`;
        console.log(text);
        return text;
      }
      return text;
    });
    this.alarmSeries.data.setAll(data);

    const cursor = this.chart.set(
      'cursor',
      am5xy.XYCursor.new(this.root, {
        xAxis: this.dateAxis,
        data: data,
        behavior: 'zoomX',
      })
    );
    cursor.lineY.set('visible', false);

    this.chart.set(
      'scrollbarX',
      am5.Scrollbar.new(this.root, {
        orientation: 'horizontal',
      })
    );
    cursor.events.on('selectstarted', () => {
      this.start = this.alarmSeries.get('tooltip').dataItem.dataContext.date;
      console.log('start ' + this.start);
    });
    cursor.events.on('cursorhidden', () => {});
    this.chart.zoomOutButton.events.on('click', () => {
      this.start = data[0].date;
      this.end = data[data.length - 1].date;

      console.log('the start ' + this.start);
      console.log('the end ' + this.end);
    });

    cursor.events.on('selectended', () => {
      this.end = this.alarmSeries.get('tooltip').dataItem.dataContext.date;
      console.log('end ' + this.end);
    });
    this.alarmSeries.columns.template.adapters.add(
      'fill',
      (fill: any, target: any) => {
        if (target.dataItem.get('valueY') < 10) {
          return am5.color('#b30000');
        } else {
          return am5.color('#ffa500');
        }
      }
    );
  }

  test(str: string) {
    // console.log(str);
    return str.slice(0, 2);
  }

  createLegend() {
    this.valueLengend = this.chart.bottomAxesContainer.children.push(
      am5.Legend.new(this.root, {
        paddingLeft: 10,
        marginTop: 40,
        centerX: am5.percent(10),
        x: am5.percent(10),
        useDefaultMarker: true,
        layout: am5.GridLayout.new(this.root, {
          maxColumns: 4,
          fixedWidthGrid: true,
        }),
      })
    );
    this.valueLengend.markers.template.setAll({
      width: 24,
      height: 24,
    });
    this.valueLengend.data.setAll(this.chart.series.values);
  }
}
