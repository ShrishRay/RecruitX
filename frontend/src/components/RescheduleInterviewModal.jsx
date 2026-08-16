import { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function RescheduleInterviewModal({
  isOpen,
  onClose,
  interview,
  onUpdated
}) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState('reschedule'); // 'reschedule' | 'cancel'

  // Initialize date/time from current interview
  const initialDate = interview?.startTime ? new Date(interview.startTime).toISOString().split('T')[0] : '';
  const initialTime = interview?.startTime
    ? new Date(interview.startTime).toTimeString().substring(0, 5)
    : '14:00';

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(String(interview?.durationMinutes || '45'));
  const [timeZone, setTimeZone] = useState(interview?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      showError('Please select both a date and time');
      return;
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(startDateTime.getTime())) {
      showError('Invalid date or time selected');
      return;
    }

    if (startDateTime < new Date()) {
      showError('New interview date and time must be in the future');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/interviews/${interview._id || interview.id}/reschedule`, {
        startTime: startDateTime.toISOString(),
        durationMinutes: Number(duration),
        timeZone,
        notes: notes.trim()
      });

      showSuccess(' Interview rescheduled! Updated calendar invites sent.');
      if (onUpdated) {
        onUpdated(res.data.interview);
      }
      onClose();
    } catch (err) {
      console.error('Reschedule error:', err);
      showError(err.response?.data?.message || 'Failed to reschedule interview');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await api.put(`/interviews/${interview._id || interview.id}/status`, {
        status: 'cancelled',
        cancellationReason: cancelReason.trim()
      });

      showSuccess('Interview cancelled. Cancellation notice dispatched to candidate.');
      if (onUpdated) {
        onUpdated({ ...interview, status: 'cancelled' });
      }
      onClose();
    } catch (err) {
      console.error('Cancel interview error:', err);
      showError(err.response?.data?.message || 'Failed to cancel interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={actionType === 'reschedule' ? 'Reschedule Interview' : 'Cancel Interview'}
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Toggle Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActionType('reschedule')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${actionType === 'reschedule'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Change Date & Time
          </button>
          <button
            type="button"
            onClick={() => setActionType('cancel')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${actionType === 'cancel'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-600'
              }`}
          >
            Cancel Meeting
          </button>
        </div>

        {/* Current Meeting Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <p className="font-extrabold text-slate-800">{interview?.title}</p>
          <p className="text-slate-600 font-medium">
            Candidate: {interview?.candidateName || interview?.candidate?.name} ({interview?.candidateEmail || interview?.candidate?.email})
          </p>
          <p className="text-slate-500 font-medium">
            Current: {interview?.startTime ? new Date(interview.startTime).toLocaleString() : 'Not set'}
          </p>
        </div>

        {actionType === 'reschedule' ? (
          <form onSubmit={handleReschedule} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Date</label>
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
                <label className="block font-bold text-slate-700 mb-1">New Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Rescheduling Reason / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Rescheduling due to conflict with architectural review session."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Close
              </Button>
              <Button type="submit" loading={loading} className="font-bold text-white bg-indigo-600 hover:bg-indigo-700">
                Update & Send Invites
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3.5">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <p className="font-bold">Are you sure you want to cancel this interview?</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                The appointment will be removed from Google Calendar and a cancellation notice will be emailed to the candidate.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Cancellation (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="e.g. Role filled or schedule conflict."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Back
              </Button>
              <Button type="button" variant="danger" loading={loading} onClick={handleCancel}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
