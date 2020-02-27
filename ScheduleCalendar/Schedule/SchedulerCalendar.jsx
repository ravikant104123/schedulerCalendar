import React, { Component } from 'react';
import SchedulerMonthViewCalendar from 'components/Common/SchedulerCalendar/SchedulerMonthViewCalendar.jsx';
import { Scrollbars } from 'react-custom-scrollbars';
import SchedulerWeekViewCalendar from 'components/Common/SchedulerCalendar/SchedulerWeekViewCalendar.jsx';

import './SchedulerCalendar.css';

export default class SchedulerCalendar extends Component {
    constructor(props) {
        super(props);
    }

    getWeekHeader = () => {
        let weekHeaderContainer = [];
        let daysInWeek = this.props.daysInWeek  ? this.props.daysInWeek : 7;
        let weekStartDay = this.props.weekStartDay !== null ? this.props.weekStartDay : 1;
        for (let i = 0; i < daysInWeek; i++) {
            weekHeaderContainer.push(
                <div className="week-header">
                    {moment().isoWeekday(weekStartDay+i).format('dddd')[0].toUpperCase()+""+moment().isoWeekday(weekStartDay+i).format('dddd').slice(1)}
                </div>
            );
        }
        return weekHeaderContainer;
    }

    render() {
        let viewWeek = !this.props.viewWeek ? false : this.props.viewWeek;
        let weekStartDay = this.props.weekStartDay !== null ? this.props.weekStartDay : 1
        let daysInWeek = this.props.daysInWeek  ? this.props.daysInWeek : 7;
        return (
            <div className="schedule-calendar">
                <div className={ ((daysInWeek == 5) ? " working-week " : " normal-week ") + "week-header-container"}>
                    {
                        this.getWeekHeader()
                    }
                </div>
                <div className="month-week-view-calendar">
                    {(viewWeek) ?
                        <Scrollbars
                            autoHide={true}
                            // renderTrackHorizontal={props => <div {...props} style={{ display: 'none' }} className="track-horizontal" />}
                        >
                            <SchedulerWeekViewCalendar
                                ref={(SchedulerWeekViewCalendar) => { this.SchedulerWeekViewCalendar = (SchedulerWeekViewCalendar) }}
                                date={this.props.date}
                                weekStartDay={weekStartDay}
                                daysInWeek={daysInWeek}
                                onScheduledItemClick={this.props.onScheduledItemClick}
                                data={this.props.data}
                                userData={this.props.userData}
                                from={this.props.from}
                            />
                        </Scrollbars>
                        :
                        <Scrollbars 
                            autoHide={true}
                            // renderTrackHorizontal={props => <div {...props} style={{ display: 'none' }} className="track-horizontal" />}
                        >
                            <SchedulerMonthViewCalendar
                                ref={(SchedulerMonthViewCalendar) => { this.SchedulerMonthViewCalendar = (SchedulerMonthViewCalendar) }}
                                date={this.props.date}
                                weekStartDay={weekStartDay}
                                daysInWeek={daysInWeek}
                                onScheduledItemClick={this.props.onScheduledItemClick}
                                data={this.props.data}
                                userData={this.props.userData}
                                from={this.props.from}
                            />
                        </Scrollbars>
                    }
                </div>
            </div>
        );
    }
}

SchedulerCalendar.defaultProps = {
    viewWeek: false,
    weekStartDay: 1,
    daysInWeek: 7,
}
