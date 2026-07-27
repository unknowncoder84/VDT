import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

// Shows a one-time popup:
//  - to the ASSIGNEE, the first time they see a task assigned to them
//  - to the ASSIGNER (admin), the first time they see their assigned task
//    marked completed
// Each is tracked in the DB (assignee_notified_at / assigner_notified_at) so
// it only ever appears once per task, and still appears later if the person
// was logged out when it happened (it waits until they next log in).
// Live updates (DataContext's realtime subscription) mean it can also pop up
// immediately while both people are online at the same time.

type QueueItem = {
  taskId: string;
  kind: 'assigned' | 'completed';
  title: string;
  who: string; // name of the other person (assigner or assignee)
};

const TaskPopupNotifier: React.FC = () => {
  const { user } = useAuth();
  const { tasks, markTaskNotified } = useData();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const pending = useMemo(() => {
    if (!user) return [];
    const items: QueueItem[] = [];

    for (const t of tasks) {
      // Assignment popup — for the person the task was assigned to
      if (
        t.assignedTo === user.id &&
        !t.assigneeNotifiedAt &&
        !seenIds.has(`a-${t.id}`)
      ) {
        items.push({ taskId: t.id, kind: 'assigned', title: t.title, who: t.assignedByName || 'Admin' });
      }
      // Completion popup — for the person who assigned it
      if (
        t.assignedBy === user.id &&
        t.status === 'completed' &&
        !t.assignerNotifiedAt &&
        !seenIds.has(`c-${t.id}`)
      ) {
        items.push({ taskId: t.id, kind: 'completed', title: t.title, who: t.assignedToName || 'Team member' });
      }
    }
    return items;
  }, [tasks, user, seenIds]);

  // Feed the queue whenever new items appear (without duplicating what's showing)
  useEffect(() => {
    if (pending.length === 0) return;
    setQueue(prev => {
      const existingKeys = new Set(prev.map(p => `${p.kind === 'assigned' ? 'a' : 'c'}-${p.taskId}`));
      const toAdd = pending.filter(p => !existingKeys.has(`${p.kind === 'assigned' ? 'a' : 'c'}-${p.taskId}`));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const current = queue[0];

  const dismiss = async () => {
    if (!current) return;
    const key = `${current.kind === 'assigned' ? 'a' : 'c'}-${current.taskId}`;
    setSeenIds(prev => new Set(prev).add(key));
    setQueue(prev => prev.slice(1));
    await markTaskNotified(current.taskId, current.kind === 'assigned' ? 'assignee' : 'assigner');
  };

  const viewTask = async () => {
    await dismiss();
    navigate('/tasks');
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-[#1a1a2e] border border-orange-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <button onClick={dismiss} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={18} />
            </button>

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              current.kind === 'assigned' ? 'bg-orange-500/15 border border-orange-500/30' : 'bg-green-500/15 border border-green-500/30'
            }`}>
              {current.kind === 'assigned'
                ? <ClipboardCheck size={26} className="text-orange-400" />
                : <CheckCircle2 size={26} className="text-green-400" />}
            </div>

            <h3 className="text-white font-bold text-lg mb-1">
              {current.kind === 'assigned' ? 'New Task Assigned to You' : 'Task Marked Completed'}
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              {current.kind === 'assigned'
                ? <>“<span className="text-white font-medium">{current.title}</span>” was assigned to you by {current.who}.</>
                : <><span className="text-white font-medium">{current.who}</span> completed “{current.title}”.</>}
            </p>

            <div className="flex gap-3">
              <button onClick={viewTask} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm">
                View Task
              </button>
              <button onClick={dismiss} className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5">
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskPopupNotifier;
