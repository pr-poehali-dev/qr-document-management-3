import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

type UserRole = 'client' | 'cashier' | 'head-cashier' | 'admin' | 'creator' | 'nikitovsky' | 'role24' | null;

interface Item {
  id: string;
  name: string;
  category: 'documents' | 'photos' | 'maps' | 'other';
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  depositDate: string;
  pickupDate?: string;
  depositAmount: number;
  pickupAmount: number;
  status: 'stored' | 'issued';
  qrCode: string;
}

interface UserAccount {
  username: string;
  phone: string;
  role: UserRole;
  blocked: boolean;
  createdAt: string;
}

const ROLE_PASSWORDS: Record<Exclude<UserRole, 'client' | null>, string> = {
  'cashier': '25',
  'head-cashier': '202520',
  'admin': '2025',
  'creator': '202505',
  'nikitovsky': '20252025',
  'role24': '2505'
};

const ROLE_COLORS: Record<Exclude<UserRole, null>, string> = {
  'client': 'bg-gray-600',
  'cashier': 'bg-gray-700',
  'head-cashier': 'bg-gray-800',
  'admin': 'bg-black',
  'creator': 'bg-gray-900',
  'nikitovsky': 'bg-gradient-to-r from-gray-900 via-black to-purple-900',
  'role24': 'bg-gradient-to-r from-black via-purple-900 to-black'
};

const ROLE_NAMES: Record<Exclude<UserRole, null>, string> = {
  'client': 'Клиент',
  'cashier': 'Кассир',
  'head-cashier': 'Главный кассир',
  'admin': 'Администратор',
  'creator': 'Создатель',
  'nikitovsky': 'Никитовский',
  'role24': '24 (Супер-админ)'
};

const getRoleLevel = (role: UserRole): number => {
  const levels: Record<Exclude<UserRole, null>, number> = {
    'client': 1,
    'cashier': 2,
    'head-cashier': 3,
    'admin': 4,
    'creator': 5,
    'nikitovsky': 6,
    'role24': 7
  };
  return role ? levels[role] : 0;
};

export default function Index() {
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [password, setPassword] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [archive, setArchive] = useState<Item[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  
  const [newUser, setNewUser] = useState({
    username: '',
    phone: '',
    role: 'client' as UserRole
  });
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'documents' as Item['category'],
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    depositDate: new Date().toISOString().split('T')[0],
    pickupDate: '',
    depositAmount: 0,
    pickupAmount: 0
  });

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        if (Date.now() > lockoutUntil) {
          setLockoutUntil(null);
          setFailedAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const handleLogin = () => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast({
        title: '🔒 Вход заблокирован',
        description: `Попробуйте через ${remainingSeconds} секунд`,
        variant: 'destructive'
      });
      return;
    }

    if (selectedRole === 'client') {
      if (clientPhone) {
        const user = users.find(u => u.phone === clientPhone && u.role === 'client');
        if (!user) {
          toast({ title: '❌ Ошибка', description: 'Клиент не найден в базе', variant: 'destructive' });
          return;
        }
        if (user.blocked) {
          toast({ title: '🔒 Доступ запрещён', description: 'Ваш аккаунт заблокирован', variant: 'destructive' });
          return;
        }
        setCurrentRole('client');
        setCurrentUsername(user.username);
        toast({ title: '✅ Добро пожаловать!', description: `Здравствуйте, ${user.username}` });
      } else {
        toast({ title: '❌ Ошибка', description: 'Введите номер телефона', variant: 'destructive' });
      }
      return;
    }

    if (selectedRole === 'nikitovsky') {
      if (password === ROLE_PASSWORDS['nikitovsky']) {
        setCurrentRole('nikitovsky');
        setFailedAttempts(0);
        setPassword('');
        toast({ title: '✅ Доступ разрешён', description: 'Вы вошли как Никитовский' });
        return;
      } else if (password === ROLE_PASSWORDS['role24']) {
        setCurrentRole('role24');
        setFailedAttempts(0);
        setPassword('');
        toast({ title: '✅ Доступ разрешён', description: 'Вы вошли как 24 (Супер-админ)' });
        return;
      }
    }

    if (selectedRole && selectedRole !== 'client' && selectedRole !== 'nikitovsky') {
      const correctPassword = ROLE_PASSWORDS[selectedRole];
      if (password === correctPassword) {
        setCurrentRole(selectedRole);
        setFailedAttempts(0);
        setPassword('');
        toast({ title: '✅ Доступ разрешён', description: `Вы вошли как ${ROLE_NAMES[selectedRole]}` });
        return;
      }
    }

    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      setLockoutUntil(Date.now() + 90000);
      toast({
        title: '🔒 Слишком много попыток',
        description: 'Вход заблокирован на 90 секунд',
        variant: 'destructive'
      });
    } else {
      toast({
        title: '❌ Неверный пароль',
        description: `Попыток осталось: ${3 - newAttempts}`,
        variant: 'destructive'
      });
    }
    setPassword('');
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setSelectedRole(null);
    setPassword('');
    setClientPhone('');
    setCurrentUsername('');
  };

  const generateQRCode = () => {
    return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handleCreateItem = () => {
    if (!newItem.name || !newItem.clientName || !newItem.clientPhone) {
      toast({ title: '❌ Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const item: Item = {
      id: Date.now().toString(),
      ...newItem,
      status: 'stored',
      qrCode: generateQRCode()
    };

    setItems([...items, item]);
    toast({ title: '✅ Товар принят', description: `QR-код: ${item.qrCode}` });
    
    setNewItem({
      name: '',
      category: 'documents',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      depositDate: new Date().toISOString().split('T')[0],
      pickupDate: '',
      depositAmount: 0,
      pickupAmount: 0
    });
  };

  const handleIssueItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const issuedItem = { ...item, status: 'issued' as const };
      setArchive([...archive, issuedItem]);
      setItems(items.filter(i => i.id !== itemId));
      toast({ title: '✅ Товар выдан', description: `Товар "${item.name}" перемещён в архив` });
    }
  };

  const handleReturnItem = (itemId: string) => {
    const item = archive.find(i => i.id === itemId);
    if (item) {
      const returnedItem = { ...item, status: 'stored' as const };
      setItems([...items, returnedItem]);
      setArchive(archive.filter(i => i.id !== itemId));
      toast({ title: '✅ Возврат выполнен', description: `Товар "${item.name}" возвращён на хранение` });
    }
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.phone) {
      toast({ title: '❌ Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    if (users.find(u => u.phone === newUser.phone)) {
      toast({ title: '❌ Ошибка', description: 'Пользователь с таким телефоном уже существует', variant: 'destructive' });
      return;
    }

    const user: UserAccount = {
      ...newUser,
      blocked: false,
      createdAt: new Date().toISOString()
    };

    setUsers([...users, user]);
    toast({ title: '✅ Пользователь создан', description: `${user.username} добавлен в систему` });
    
    setNewUser({
      username: '',
      phone: '',
      role: 'client'
    });
  };

  const toggleUserBlock = (phone: string) => {
    setUsers(users.map(u => 
      u.phone === phone ? { ...u, blocked: !u.blocked } : u
    ));
    const user = users.find(u => u.phone === phone);
    if (user) {
      toast({ 
        title: user.blocked ? '✅ Пользователь разблокирован' : '🔒 Пользователь заблокирован',
        description: user.username 
      });
    }
  };

  const canAcceptItems = currentRole && getRoleLevel(currentRole) >= getRoleLevel('head-cashier');
  const canIssueItems = currentRole && getRoleLevel(currentRole) >= getRoleLevel('cashier');
  const canReturnItems = currentRole && getRoleLevel(currentRole) >= getRoleLevel('cashier');
  const canViewArchive = currentRole !== null;
  const canManageRoles = currentRole && getRoleLevel(currentRole) >= getRoleLevel('nikitovsky');

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 animate-scale-in shadow-2xl bg-gray-950 border-gray-800">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center">
              <Icon name="QrCode" size={40} className="text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              QR Документы
            </h1>
            <p className="text-gray-400 mt-2">Система управления хранением</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-center mb-4 text-white">Выберите тип входа</h2>
              {(['client', 'cashier', 'head-cashier', 'admin', 'creator'] as const).map((role) => (
                <Button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full h-14 text-lg font-semibold ${ROLE_COLORS[role]} hover:opacity-90 transition-all hover:scale-105 text-white border-0`}
                >
                  {ROLE_NAMES[role]}
                </Button>
              ))}
              
              <Button
                onClick={() => setSelectedRole('nikitovsky')}
                className={`w-full h-14 text-lg font-semibold ${ROLE_COLORS['nikitovsky']} hover:opacity-90 transition-all hover:scale-105 text-white border-0`}
              >
                Никитовский
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <Badge className={`${ROLE_COLORS[selectedRole]} text-white px-4 py-2 border-0`}>
                  {ROLE_NAMES[selectedRole]}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRole(null)} className="text-white hover:text-gray-300">
                  <Icon name="ArrowLeft" size={20} />
                </Button>
              </div>

              {selectedRole === 'client' ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Номер телефона</Label>
                    <Input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="text-lg bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Пароль</Label>
                    <Input
                      type="password"
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="text-lg bg-gray-900 border-gray-700 text-white"
                      disabled={lockoutUntil !== null && Date.now() < lockoutUntil}
                    />
                  </div>
                  {lockoutUntil && Date.now() < lockoutUntil && (
                    <p className="text-sm text-red-400 text-center">
                      ⏳ Блокировка: {Math.ceil((lockoutUntil - Date.now()) / 1000)} сек
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleLogin}
                className="w-full h-12 text-lg font-semibold bg-white text-black hover:bg-gray-200"
                disabled={lockoutUntil !== null && Date.now() < lockoutUntil}
              >
                Войти
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const clientItems = currentRole === 'client' ? items.filter(i => i.clientPhone === clientPhone) : items;
  const clientArchive = currentRole === 'client' ? archive.filter(i => i.clientPhone === clientPhone) : archive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Icon name="QrCode" size={24} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">QR Документы</h1>
              <Badge className={`${ROLE_COLORS[currentRole]} text-white mt-1 border-0`}>
                {ROLE_NAMES[currentRole]}
              </Badge>
            </div>
          </div>
          <Button onClick={handleLogout} className="gap-2 bg-gray-800 text-white hover:bg-gray-700 border-0">
            <Icon name="LogOut" size={18} />
            Выйти
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className={`grid w-full max-w-2xl mx-auto bg-gray-900 border border-gray-800 ${canAcceptItems && canManageRoles ? 'grid-cols-4' : canAcceptItems ? 'grid-cols-3' : 'grid-cols-3'}`}>
            <TabsTrigger value="items" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400">
              <Icon name="Package" size={18} />
              Товары
            </TabsTrigger>
            {canAcceptItems && (
              <TabsTrigger value="new" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400">
                <Icon name="Plus" size={18} />
                Приём
              </TabsTrigger>
            )}
            {canViewArchive && (
              <TabsTrigger value="archive" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400">
                <Icon name="Archive" size={18} />
                Архив
              </TabsTrigger>
            )}
            {canManageRoles && (
              <TabsTrigger value="management" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400">
                <Icon name="Settings" size={18} />
                Управление
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="items" className="space-y-4 animate-fade-in">
            {clientItems.length === 0 ? (
              <Card className="p-12 text-center bg-gray-950 border-gray-800">
                <Icon name="Package" size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Нет товаров на хранении</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clientItems.map((item) => (
                  <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow animate-slide-up bg-gray-950 border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-gray-800 text-gray-200 border-0">{item.category}</Badge>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-white">{item.qrCode}</div>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 text-white">{item.name}</h3>
                    <div className="space-y-1 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={14} />
                        {item.clientName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={14} />
                        {item.clientPhone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={14} />
                        {item.depositDate}
                      </div>
                    </div>

                    <div className="flex gap-2 text-sm mb-4">
                      <div className="flex-1 bg-green-950 border border-green-900 rounded p-2">
                        <div className="text-green-400 font-semibold">{item.depositAmount}₽</div>
                        <div className="text-xs text-green-600">Внесено</div>
                      </div>
                      <div className="flex-1 bg-orange-950 border border-orange-900 rounded p-2">
                        <div className="text-orange-400 font-semibold">{item.pickupAmount}₽</div>
                        <div className="text-xs text-orange-600">При выдаче</div>
                      </div>
                    </div>

                    {canIssueItems && currentRole !== 'client' && (
                      <Button
                        onClick={() => handleIssueItem(item.id)}
                        className="w-full bg-white text-black hover:bg-gray-200 border-0"
                      >
                        <Icon name="CheckCircle" size={18} className="mr-2" />
                        Выдать
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {canAcceptItems && (
            <TabsContent value="new" className="animate-fade-in">
              <Card className="max-w-2xl mx-auto p-6 bg-gray-950 border-gray-800">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Icon name="Plus" size={24} />
                  Приём нового товара
                </h2>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Название товара *</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="Например: Паспорт"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Категория *</Label>
                      <select
                        className="w-full h-10 rounded-md border border-gray-700 bg-gray-900 px-3 text-white"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value as Item['category'] })}
                      >
                        <option value="documents">Документы</option>
                        <option value="photos">Фото</option>
                        <option value="maps">Карты</option>
                        <option value="other">Другое</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">ФИО клиента *</Label>
                      <Input
                        value={newItem.clientName}
                        onChange={(e) => setNewItem({ ...newItem, clientName: e.target.value })}
                        placeholder="Иванов Иван Иванович"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Телефон *</Label>
                      <Input
                        type="tel"
                        value={newItem.clientPhone}
                        onChange={(e) => setNewItem({ ...newItem, clientPhone: e.target.value })}
                        placeholder="+7 (___) ___-__-__"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Email (необязательно)</Label>
                    <Input
                      type="email"
                      value={newItem.clientEmail}
                      onChange={(e) => setNewItem({ ...newItem, clientEmail: e.target.value })}
                      placeholder="example@mail.ru"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Дата приёма *</Label>
                      <Input
                        type="date"
                        value={newItem.depositDate}
                        onChange={(e) => setNewItem({ ...newItem, depositDate: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Дата выдачи (план)</Label>
                      <Input
                        type="date"
                        value={newItem.pickupDate}
                        onChange={(e) => setNewItem({ ...newItem, pickupDate: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Сумма при приёме (₽)</Label>
                      <Input
                        type="number"
                        value={newItem.depositAmount}
                        onChange={(e) => setNewItem({ ...newItem, depositAmount: Number(e.target.value) })}
                        placeholder="0"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Сумма при выдаче (₽)</Label>
                      <Input
                        type="number"
                        value={newItem.pickupAmount}
                        onChange={(e) => setNewItem({ ...newItem, pickupAmount: Number(e.target.value) })}
                        placeholder="0"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateItem}
                    className="w-full h-12 text-lg bg-white text-black hover:bg-gray-200 border-0"
                  >
                    <Icon name="Plus" size={20} className="mr-2" />
                    Принять товар и создать QR
                  </Button>
                </div>
              </Card>
            </TabsContent>
          )}

          {canViewArchive && (
            <TabsContent value="archive" className="space-y-4 animate-fade-in">
              {clientArchive.length === 0 ? (
                <Card className="p-12 text-center bg-gray-950 border-gray-800">
                  <Icon name="Archive" size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">Архив пуст</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clientArchive.map((item) => (
                    <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow bg-gray-950 border-gray-800">
                      <Badge className="bg-gray-800 text-gray-300 mb-4 border-0">Выдано</Badge>
                      <h3 className="font-semibold text-lg mb-2 text-white">{item.name}</h3>
                      <div className="space-y-1 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <Icon name="User" size={14} />
                          {item.clientName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="QrCode" size={14} />
                          {item.qrCode}
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Phone" size={14} />
                          {item.clientPhone}
                        </div>
                      </div>
                      
                      {canReturnItems && currentRole !== 'client' && (
                        <Button
                          onClick={() => handleReturnItem(item.id)}
                          className="w-full bg-gray-800 text-white hover:bg-gray-700 border-0"
                        >
                          <Icon name="RotateCcw" size={18} className="mr-2" />
                          Вернуть на хранение
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {canManageRoles && (
            <TabsContent value="management" className="space-y-6 animate-fade-in">
              <Card className="p-6 bg-gray-950 border-gray-800">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Icon name="Users" size={24} />
                  Управление пользователями
                </h2>

                <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
                  <h3 className="font-semibold mb-4 text-white">Создать нового пользователя</h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-gray-300">ФИО</Label>
                      <Input
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Иван Иванов"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Телефон</Label>
                      <Input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        placeholder="+7 (___) ___-__-__"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Роль</Label>
                      <select
                        className="w-full h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-white"
                        value={newUser.role || 'client'}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      >
                        <option value="client">Клиент</option>
                        {currentRole === 'role24' && (
                          <>
                            <option value="cashier">Кассир</option>
                            <option value="head-cashier">Главный кассир</option>
                            <option value="admin">Администратор</option>
                            <option value="creator">Создатель</option>
                            <option value="nikitovsky">Никитовский</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleCreateUser} className="w-full bg-white text-black hover:bg-gray-200 border-0">
                    <Icon name="UserPlus" size={18} className="mr-2" />
                    Создать пользователя
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Список пользователей ({users.length})</h3>
                  {users.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Пользователи ещё не созданы</p>
                  ) : (
                    users.map((user) => (
                      <Card key={user.phone} className="p-4 bg-gray-900 border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{user.username}</span>
                              <Badge className={`${ROLE_COLORS[user.role]} text-white text-xs border-0`}>
                                {ROLE_NAMES[user.role]}
                              </Badge>
                              {user.blocked && (
                                <Badge variant="destructive" className="text-xs">Заблокирован</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{user.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!user.blocked}
                              onCheckedChange={() => toggleUserBlock(user.phone)}
                              disabled={currentRole !== 'role24' && user.role === 'nikitovsky'}
                            />
                            <span className="text-sm text-gray-400">
                              {user.blocked ? 'Заблокирован' : 'Активен'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-gray-950 border-gray-800">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Icon name="BarChart3" size={24} />
                  Статистика системы
                </h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-gray-900 border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Package" size={20} className="text-white" />
                      <span className="font-semibold text-gray-300">Товаров на хранении</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{items.length}</p>
                  </Card>

                  <Card className="p-4 bg-gray-900 border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Archive" size={20} className="text-white" />
                      <span className="font-semibold text-gray-300">В архиве</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{archive.length}</p>
                  </Card>

                  <Card className="p-4 bg-gray-900 border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Users" size={20} className="text-white" />
                      <span className="font-semibold text-gray-300">Пользователей</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                  </Card>
                </div>

                {currentRole === 'role24' && (
                  <div className="mt-6 p-4 bg-red-950 border border-red-900 rounded-lg">
                    <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <Icon name="ShieldAlert" size={20} />
                      Супер-админ функции
                    </h3>
                    <p className="text-sm text-red-300 mb-3">
                      У вас максимальные права в системе. Вы можете управлять всеми ролями, включая Никитовского.
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
