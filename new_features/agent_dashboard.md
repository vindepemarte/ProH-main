# Agent Dashboard Enhancements

## Overview
Improve the Agent dashboard with analytics, data visualization, and pricing configuration capabilities.

## Tasks

### Analytics Implementation
- [ ] Add analytics section with the following metrics:
  - [ ] Total Revenue: Sum of money received from students
  - [ ] Total Profit: Revenue minus costs
  - [ ] Total Homework: Count of assignments from students
  - [ ] Total Students: Count of students under agent
  - [ ] Avg. Profit: Average profit per homework
  - [ ] TBP S.Agent: Amount to be paid to Super Agent based on pricing config + Super Worker fees

### Data Visualization
- [ ] Implement charts for:
  - [ ] Total Revenue
  - [ ] Total Homeworks
  - [ ] Total Students
  - [ ] Total Profit

### Pricing Configuration
- [ ] Add pricing settings page similar to Super Agent role
- [ ] Implement word count pricing from 500 to 20000 words
- [ ] Create UI for configuring pricing tiers
- [ ] Add validation to ensure prices are within acceptable ranges

## Implementation Strategy

1. Create an analytics component that fetches and displays key metrics
2. Implement data visualization components using a charting library
3. Develop a pricing configuration interface similar to the Super Agent role
4. Add backend handlers for saving and retrieving pricing configurations