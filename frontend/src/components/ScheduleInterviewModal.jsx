import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  application,
  job,
  onScheduled
}) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  // Default values
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  const formattedDefaultDate = defaultDate.toISOString().split('T')[0];

  const [date, setDate] = useState(formattedDefaultDate);
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState('45');
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const candidate = application?.candidate || {};
  const jobTitle = job?.title || application?.job?.title || 'Engineering Role';

  useEffect(() => {
    if (candidate.name && jobTitle) {
      setTitle(`Technical Interview: ${candidate.name} - ${jobTitle}`);
    }
  }, [candidate.name, jobTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      showError('Please select both a date and time for the interview');
      return;
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(startDateTime.getTime())) {
      showError('Invalid date or time selected');
      return;
    }

    if (startDateTime < new Date()) {
      showError('Interview date and time must be in the future');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/interviews/schedule', {
        applicationId: application.applicationId || application._id,
        startTime: startDateTime.toISOString(),
        durationMinutes: Number(duration),
        timeZone,
        title: title.trim(),
        description: description.trim()
      });

      showSuccess('Interview scheduled! Calendar appointments and Google Meet link dispatched.');
      if (onScheduled) {
        onScheduled(res.data.interview || res.data);
      }
      onClose();
    } catch (err) {
      console.error('Schedule interview error:', err);
      showError(err.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Candidate Interview"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Candidate & Job Summary Box */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px]">
              Candidate Details
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              Shortlisted
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900">{candidate.name}</p>
          <p className="text-slate-600 font-medium">{candidate.email} · {jobTitle}</p>
        </div>

        {/* Meeting Title */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Interview Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
            placeholder="e.g. Technical Round 1"
            required
          />
        </div>

        {/* Date, Time & Duration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes (1 hr)</option>
              <option value="90">90 Minutes (1.5 hrs)</option>
            </select>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Timezone
          </label>
          <input
            type="text"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden text-xs"
            placeholder="e.g. UTC, Asia/Kolkata, America/New_York"
          />
        </div>

        {/* Agenda / Instructions */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Interview Agenda & Instructions (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs resize-none"
            placeholder="e.g. Please be prepared to discuss your past projects, coding architecture, and system design experience."
          />
        </div>

        {/* Feature Highlights Banner */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl flex items-start gap-2.5">
          <div className="space-y-0.5">
            <p className="font-bold text-emerald-950 text-xs">
              Automated Google Meet & Calendar Appointment
            </p>
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              RecruitX will generate a dedicated <strong>Google Meet video link</strong> and create calendar appointments on both candidate and recruiter calendars with email invitations.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
          >
            Confirm & Schedule Meet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
