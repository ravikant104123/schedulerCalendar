import React from 'react';

import { checkUserPermission } from "common/CommonFunctions.jsx";
import SchedulerCalendar from './SchedulerCalendar.jsx';
import NewConversation from 'components/Conversations/NewConversation/NewConversation.jsx';

import './ConversationScheduler.css'

export default class ConversationScheduler extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: []
        }
        this.data = {
            toggleValue: "Month"
        }
        this.selectedEventDate = "";
    }

    scheduleInfo = () => {
        this.props.loadData();
    }

    onScheduledItemClick = (record) => {
        this.scheduleMessage.newConversationPopoverToggle(1, record)
    }

    render() {
        return (
            <React.Fragment>
                <div className="conversation-main-panel-2-content-toolbar" style={{ background: "#fff" }}>
                    <div className="display-left month-title-bar">
                        <i className="far fa-chevron-left" onClick={() => { this.props.changeCalendar({ prev: true }); }}>
                        </i>
                        <i className="far fa-chevron-right" onClick={() => { this.props.changeCalendar({ next: true }) }}>
                        </i>
                        <span style={{ textTransform: "capitalize" }}>{moment(moment(this.props.date)._d).format('MMMM Y')}</span>
                    </div>
                    {
                        (checkUserPermission("CONVERSATIONS_SCHEDULER_ADD", this.props.userData)) ?
                            <button className="save-button" style={{ whiteSpace: "nowrap" }} onClick={() => { this.scheduleMessage.newConversationPopoverToggle(1) }} >
                                <i className="fas fa-plus-circle" style={{ color: "#ffffff" }}></i>&nbsp;&nbsp;{lang("SCHEDULE_MESSAGE")}
                            </button>
                            :
                            null
                    }
                </div>
                {
                    (this.props.viewWeek !== null && this.props.weekStartDay !== null && this.props.daysInWeek !== null) ?
                        <SchedulerCalendar
                            ref={(SchedulerCalendar) => { this.SchedulerCalendar = SchedulerCalendar }}
                            date={this.props.date}
                            onScheduledItemClick={this.onScheduledItemClick}
                            weekStartDay={this.props.weekStartDay}
                            viewWeek={this.props.viewWeek}
                            daysInWeek={this.props.daysInWeek}
                            userData={this.props.userData}
                            data={this.props.data}
        
                        /> : null
                }
                <NewConversation
                    ref={(scheduleMessage) => this.scheduleMessage = scheduleMessage}
                    overlayHeader={lang("SCHEDULE_MESSAGE")}
                    nameField={true}
                    desciptionField={true}
                    scheduleDateTime={true}
                    eventMarker={true}
                    scheduleInfo={this.scheduleInfo}
                    deleteEvent={this.deleteEvent}
                    date={this.props.date}
                    userData={this.props.userData}
                    showDeleteButton={true}
                    inbox_no={this.props.inbox_no}
                    fromScheduler={true}
                />
            </React.Fragment>
        )
    }
}

ConversationScheduler.defaultProps = {
    weekStartDay: 1,
	daysInWeek: 7,
}