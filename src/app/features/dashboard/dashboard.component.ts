import { Component, OnInit } from '@angular/core';
import { DashboardService } from './dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  total = 0;

  constructor(private service: DashboardService) {}

  ngOnInit() {
    this.service.getStats().subscribe(res => {
      this.total = res.totalStudents;

      this.createChart('classChart', res.byClass);
      this.createChart('sectionChart', res.bySection);
    });
  }

  createChart(canvasId: string, data: any[]) {
  new Chart(canvasId, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Students',
        data: data.map(d => d.count),
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#42a5f5',
          '#66bb6a',
          '#ffa726'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}
}